import re
import uuid
import hashlib
from langchain.prompts import ChatPromptTemplate
from graph.state import DevDocState
import asyncio
from groq import RateLimitError
from utils.groq_pool import make_llm

# In-memory cache for generated docs (content hash -> generated doc)
# Key: hash of (file_path + module_content + dev_notes_section)
_doc_cache: dict[str, dict] = {}

# Semaphore to limit concurrent LLM calls (respect rate limits)
_llm_semaphore = asyncio.Semaphore(8)  # 8 concurrent LLM calls

# How many modules go into ONE LLM call. 5 is the sweet spot:
# fewer calls = faster, but too many modules per call risks a sloppy/parse-failing response.
DOC_BATCH_SIZE = 5

# Boundary marker the LLM must print before each module's docs in a batch.
# Parsed with regex below — keep both in sync.
_BOUNDARY_RE = re.compile(r"^<<<DOC-BOUNDARY:\s*(.+?)\s*>>>\s*$", re.MULTILINE)

# Prompt template for single-module doc generation (used for cache-miss fallback)
DOC_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert technical writer specializing in Python documentation.
Generate clear, structured Markdown documentation for the given Python module.

Follow this structure:
# Module Name

Brief description of what this module does.

## Classes
For each class: description, attributes, methods with parameters and return types.

## Functions
For each function: description, parameters, return type, example usage.

## Dependencies
Key imports and what they're used for.

Keep it developer-friendly. Be concise but complete.
If dev_notes are provided, incorporate that feedback into the documentation."""),

    ("human", """Generate documentation for this Python module:

**File:** {file_path}
**Module:** {module_name}

**Module Docstring:** {docstring}

**Classes:**
{classes}

**Functions:**
{functions}

**Imports:**
{imports}

{dev_notes_section}

Generate the Markdown documentation now:""")
])

# Prompt template for BATCHED doc generation — several modules per LLM call.
DOC_BATCH_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert technical writer specializing in Python documentation.
Generate clear, structured Markdown documentation for EACH Python module given below.

For every module, follow this structure:
# Module Name

Brief description of what this module does.

## Classes
For each class: description, attributes, methods with parameters and return types.

## Functions
For each function: description, parameters, return type, example usage.

## Dependencies
Key imports and what they're used for.

CRITICAL FORMATTING RULE:
- Start EACH module's documentation with a line exactly like this, using that module's real file path:
  <<<DOC-BOUNDARY: some/module.py>>>
- Do not write ANY text before the first boundary line.
- Do not skip any module. Document every module listed.

Keep it developer-friendly. Be concise but complete.
If dev_notes are provided, incorporate that feedback into every module's documentation."""),

    ("human", """Generate documentation for EACH of these {count} Python modules:

{modules_block}

{dev_notes_section}

Begin now — first line must be the boundary line of the first module:""")
])

# Helper functions to format AST data for the prompt
def format_classes(classes: list) -> str:
    """Format class data for the prompt"""
    if not classes:
        return "None"

    result = []
    for cls in classes:
        methods_str = ", ".join(m["name"] for m in cls.get("methods", []))
        result.append(
            f"- {cls['name']}: {cls.get('docstring', 'No docstring')} | Methods: {methods_str or 'none'}"
        )
    return "\n".join(result)

# Helper function to format functions for the prompt
def format_functions(functions: list) -> str:
    """Format function data for the prompt"""
    if not functions:
        return "None"

    result = []
    for fn in functions:
        args_str = ", ".join(fn.get("args", []))
        result.append(
            f"- {fn['name']}({args_str}): {fn.get('docstring', 'No docstring')}"
        )
    return "\n".join(result)


def _cache_key_for(module: dict, dev_notes_section: str) -> str:
    """Cache key from module content + dev notes."""
    module_content = f"{module['file_path']}{module['module_name']}{module.get('docstring','')}{module.get('classes','')}{module.get('functions','')}{module.get('imports','')}{dev_notes_section}"
    return hashlib.sha256(module_content.encode()).hexdigest()


def _format_module_for_batch(module: dict) -> str:
    """Compact one-module block for the batch prompt."""
    return (
        f"--- MODULE ---\n"
        f"File: {module['file_path']}\n"
        f"Module: {module['module_name']}\n"
        f"Module Docstring: {module.get('docstring') or 'No module docstring'}\n"
        f"Classes:\n{format_classes(module.get('classes', []))}\n"
        f"Functions:\n{format_functions(module.get('functions', []))}\n"
        f"Imports: {', '.join(module.get('imports', [])) or 'None'}\n"
    )


def _split_batch_response(response_text: str) -> dict[str, str]:
    """
    Split a batched LLM response into {file_path: doc_content}.
    Returns only non-empty docs.
    """
    parts = _BOUNDARY_RE.split(response_text)
    docs: dict[str, str] = {}
    # parts[0] = preamble; then alternating (file_path, content) pairs
    for i in range(1, len(parts), 2):
        file_path = parts[i].strip()
        content = parts[i + 1].strip() if i + 1 < len(parts) else ""
        if file_path and content:
            docs[file_path] = content
    return docs


async def _generate_docs_for_batch(
    modules: list[dict], dev_notes_section: str
) -> dict[str, str]:
    """One LLM call for a whole batch. Returns {file_path: doc_content} (may be partial/empty)."""
    modules_block = "\n".join(_format_module_for_batch(m) for m in modules)

    max_retries = 3
    response = None
    async with _llm_semaphore:
        for attempt in range(max_retries):
            try:
                # Fresh client har attempt pe = har baar nayi rotated key.
                # 429 aaya to agli key se retry hota hai.
                batch_chain = DOC_BATCH_PROMPT | make_llm()
                response = await batch_chain.ainvoke({
                    "count": len(modules),
                    "modules_block": modules_block,
                    "dev_notes_section": dev_notes_section,
                })
                break
            except RateLimitError:
                wait_time = 2 ** attempt
                print(f"⏳ Rate limited (batch), rotating key, waiting {wait_time}s before retry...")
                await asyncio.sleep(wait_time)

    if response is None:
        print(f"⚠️ Batch of {len(modules)} modules failed after {max_retries} attempts")
        return {}

    return _split_batch_response(response.content)


async def _generate_doc_for_module(module: dict, dev_notes_section: str) -> dict | None:
    """Generate docs for a single module with retry logic and caching (fallback path)."""
    if "error" in module:
        print(f" Skipping errored module: {module.get('file_path')}")
        return None

    cache_key = _cache_key_for(module, dev_notes_section)

    if cache_key in _doc_cache:
        print(f"♻️ Cache hit (skipping LLM): {module['file_path']}")
        cached = _doc_cache[cache_key]
        # Return new doc_id but cached content
        return {
            "doc_id": str(uuid.uuid4()),
            "file_path": cached["file_path"],
            "module_name": cached["module_name"],
            "content": cached["content"],
        }

    print(f"🤖 Generating docs for: {module['file_path']}")

    max_retries = 3
    response = None
    async with _llm_semaphore:
        for attempt in range(max_retries):
            try:
                # Fresh client har attempt pe = har baar nayi rotated key
                single_chain = DOC_PROMPT | make_llm()
                response = await single_chain.ainvoke({
                    "file_path": module["file_path"],
                    "module_name": module["module_name"],
                    "docstring": module.get("docstring") or "No module docstring",
                    "classes": format_classes(module.get("classes", [])),
                    "functions": format_functions(module.get("functions", [])),
                    "imports": ", ".join(module.get("imports", [])) or "None",
                    "dev_notes_section": dev_notes_section,
                })
                break
            except RateLimitError:
                wait_time = 2 ** attempt
                print(f"⏳ Rate limited, rotating key, waiting {wait_time}s before retry...")
                await asyncio.sleep(wait_time)

    if response is None:
        print(f"⚠️ Skipping {module['file_path']} after {max_retries} failed attempts")
        return None

    result = {
        "doc_id": str(uuid.uuid4()),
        "file_path": module["file_path"],
        "module_name": module["module_name"],
        "content": response.content,
    }

    # Cache the result
    _doc_cache[cache_key] = {
        "file_path": module["file_path"],
        "module_name": module["module_name"],
        "content": response.content,
    }

    return result


# LangGraph node — generates structured Markdown docs for each parsed module.
async def doc_generator_node(state: DevDocState) -> dict:
    """
    LangGraph node — generates structured Markdown docs for parsed modules.

    Steps:
    1. Serve cache hits instantly (no LLM call at all)
    2. Batch remaining modules: DOC_BATCH_SIZE modules per LLM call
       (up to 8 concurrent batches via semaphore, keys rotated per call)
    3. Anything a batch response missed → single-module fallback generation
    4. Return generated_docs list

    If review_status is "rejected", uses dev_notes as feedback for regeneration.
    """
    print(f"📝 Generating docs for {len(state.parsed_modules)} modules")

    # If rejected by dev, include their feedback
    dev_notes_section = ""
    if state.review_status == "rejected" and state.dev_notes:
        dev_notes_section = f"**Dev Feedback (incorporate this):** {state.dev_notes}"

    # Filter out errored modules upfront
    valid_modules = [m for m in state.parsed_modules if "error" not in m]

    # 1. Cache hits return instantly without any LLM call
    uncached: list[dict] = []
    generated_docs: list[dict] = []
    for module in valid_modules:
        cache_key = _cache_key_for(module, dev_notes_section)
        if cache_key in _doc_cache:
            print(f"♻️ Cache hit (skipping LLM): {module['file_path']}")
            cached = _doc_cache[cache_key]
            generated_docs.append({
                "doc_id": str(uuid.uuid4()),
                "file_path": cached["file_path"],
                "module_name": cached["module_name"],
                "content": cached["content"],
            })
        else:
            uncached.append(module)

    # 2. Batch the rest — DOC_BATCH_SIZE modules per LLM call
    batches = [uncached[i:i + DOC_BATCH_SIZE] for i in range(0, len(uncached), DOC_BATCH_SIZE)]
    if batches:
        print(f"📦 {len(uncached)} modules → {len(batches)} batched LLM calls "
              f"(previously {len(uncached)} individual calls)")

    async def _process_batch(batch: list[dict]) -> list[dict]:
        results: list[dict] = []
        batch_docs = await _generate_docs_for_batch(batch, dev_notes_section)

        for module in batch:
            content = batch_docs.get(module["file_path"], "").strip()
            if content:
                doc = {
                    "doc_id": str(uuid.uuid4()),
                    "file_path": module["file_path"],
                    "module_name": module["module_name"],
                    "content": content,
                }
                results.append(doc)
                _doc_cache[_cache_key_for(module, dev_notes_section)] = {
                    "file_path": module["file_path"],
                    "module_name": module["module_name"],
                    "content": content,
                }
                print(f"✅ Docs generated (batch): {module['file_path']}")
            else:
                # Fallback: generate individually for anything the batch missed
                print(f"⚠️ Batch missed {module['file_path']} — retrying individually")
                single = await _generate_doc_for_module(module, dev_notes_section)
                if single is not None:
                    results.append(single)
                    print(f"✅ Docs generated (fallback): {module['file_path']}")
        return results

    batch_results = await asyncio.gather(
        *[_process_batch(b) for b in batches], return_exceptions=True
    )
    for result in batch_results:
        if isinstance(result, Exception):
            print(f"⚠️ Batch failed: {result}")
            continue
        generated_docs.extend(result)

    return {
        "generated_docs": generated_docs,
        "current_step": "doc_generator",
    }

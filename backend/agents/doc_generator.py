import uuid
import hashlib
from langchain_groq import ChatGroq
from langchain.prompts import ChatPromptTemplate
from graph.state import DevDocState
from config import get_settings
import asyncio
from groq import RateLimitError

settings = get_settings()

# Groq LLM client
llm = ChatGroq(
    api_key=settings.GROQ_API_KEY,
    model=settings.GROQ_MODEL,
    temperature=0.3,   # low temp = consistent, structured output
)

# In-memory cache for generated docs (content hash -> generated doc)
# Key: hash of (file_path + module_content + dev_notes_section)
_doc_cache: dict[str, dict] = {}

# Semaphore to limit concurrent LLM calls (respect rate limits)
_llm_semaphore = asyncio.Semaphore(8)  # 8 concurrent LLM calls

# Prompt template for doc generation
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

async def _generate_doc_for_module(module: dict, dev_notes_section: str, chain) -> dict | None:
    """Generate docs for a single module with retry logic and caching."""
    if "error" in module:
        print(f" Skipping errored module: {module.get('file_path')}")
        return None

    # Create cache key from module content + dev notes
    module_content = f"{module['file_path']}{module['module_name']}{module.get('docstring','')}{module.get('classes','')}{module.get('functions','')}{module.get('imports','')}{dev_notes_section}"
    cache_key = hashlib.sha256(module_content.encode()).hexdigest()
    
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
                response = await chain.ainvoke({
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
                print(f"⏳ Rate limited, waiting {wait_time}s before retry...")
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
    LangGraph node — generates structured Markdown docs for each parsed module.

    Steps:
    1. For each parsed_module from codebase_parser
    2. Build prompt with AST data
    3. Call Groq LLM (up to 8 concurrent via semaphore, cached results skip L entirely)
    4. Return generated_docs list

    If review_status is "rejected", uses dev_notes as feedback for regeneration.
    """
    print(f"📝 Generating docs for {len(state.parsed_modules)} modules")

    # If rejected by dev, include their feedback
    dev_notes_section = ""
    if state.review_status == "rejected" and state.dev_notes:
        dev_notes_section = f"**Dev Feedback (incorporate this):** {state.dev_notes}"

    chain = DOC_PROMPT | llm

    # Filter out errored modules upfront
    valid_modules = [m for m in state.parsed_modules if "error" not in m]
    generated_docs = []

    # Process all modules concurrently (semaphore limits to 8 LLM calls)
    # Cache hits return instantly without LLM call
    tasks = [_generate_doc_for_module(module, dev_notes_section, chain) for module in valid_modules]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for module, result in zip(valid_modules, results):
        if isinstance(result, Exception):
            print(f"⚠️ Error generating docs for {module['file_path']}: {result}")
            continue
        if result is not None:
            generated_docs.append(result)
            print(f"✅ Docs generated: {module['file_path']}")

    return {
        "generated_docs": generated_docs,
        "current_step": "doc_generator",
    }
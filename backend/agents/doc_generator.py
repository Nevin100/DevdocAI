import uuid
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
    """Generate docs for a single module with retry logic."""
    if "error" in module:
        print(f" Skipping errored module: {module.get('file_path')}")
        return None

    print(f"🤖 Generating docs for: {module['file_path']}")

    max_retries = 3
    response = None
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

    return {
        "doc_id": str(uuid.uuid4()),
        "file_path": module["file_path"],
        "module_name": module["module_name"],
        "content": response.content,
    }


# LangGraph node — generates structured Markdown docs for each parsed module.
async def doc_generator_node(state: DevDocState) -> dict:
    """
    LangGraph node — generates structured Markdown docs for each parsed module.

    Steps:
    1. For each parsed_module from codebase_parser
    2. Build prompt with AST data
    3. Call Groq LLM (5 files concurrently per batch, 1s delay between batches)
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

    BATCH_SIZE = 5
    BATCH_DELAY = 1.0

    for i in range(0, len(valid_modules), BATCH_SIZE):
        batch = valid_modules[i:i + BATCH_SIZE]
        print(f"📦 Processing batch {i // BATCH_SIZE + 1}/{(len(valid_modules) + BATCH_SIZE - 1) // BATCH_SIZE} ({len(batch)} files)")

        tasks = [_generate_doc_for_module(module, dev_notes_section, chain) for module in batch]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for module, result in zip(batch, results):
            if isinstance(result, Exception):
                print(f"⚠️ Error generating docs for {module['file_path']}: {result}")
                continue
            if result is not None:
                generated_docs.append(result)
                print(f"✅ Docs generated: {module['file_path']}")

        # Delay between batches (except after the last batch)
        if i + BATCH_SIZE < len(valid_modules):
            await asyncio.sleep(BATCH_DELAY)

    return {
        "generated_docs": generated_docs,
        "current_step": "doc_generator",
    }
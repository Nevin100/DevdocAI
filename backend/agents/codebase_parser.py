import ast
import asyncio
import hashlib
from concurrent.futures import ThreadPoolExecutor
from graph.state import DevDocState
from mcp.github_server import list_python_files, get_file_content

# Thread pool for CPU-bound AST parsing
_parse_executor = ThreadPoolExecutor(max_workers=8)

# Simple in-memory cache for parsed files (content hash -> parsed result)
_parse_cache: dict[str, dict] = {}

# Codebase Parser Node :
def parse_python_file(file_path: str, source_code: str) -> dict:
    """
    Parse a single Python file using AST.
    Extracts classes, functions, imports, and module docstring.
    """
    try:
        tree = ast.parse(source_code)
    except SyntaxError as e:
        return {"file_path": file_path, "error": str(e)}

    module_docstring = ast.get_docstring(tree) or ""
    imports = []
    classes = []
    functions = []

    for node in ast.walk(tree):
        # Extract imports
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.append(alias.name)

        elif isinstance(node, ast.ImportFrom):
            module = node.module or ""
            for alias in node.names:
                imports.append(f"{module}.{alias.name}")

        # Extract top-level classes
        elif isinstance(node, ast.ClassDef):
            methods = []
            for item in node.body:
                if isinstance(item, ast.FunctionDef):
                    methods.append({
                        "name": item.name,
                        "docstring": ast.get_docstring(item) or "",
                        "args": [arg.arg for arg in item.args.args],
                        "lineno": item.lineno,
                    })

            classes.append({
                "name": node.name,
                "docstring": ast.get_docstring(node) or "",
                "methods": methods,
                "lineno": node.lineno,
            })

        # Extract top-level functions only
        elif isinstance(node, ast.FunctionDef) and isinstance(node.col_offset == 0, bool):
            if node.col_offset == 0:
                functions.append({
                    "name": node.name,
                    "docstring": ast.get_docstring(node) or "",
                    "args": [arg.arg for arg in node.args.args],
                    "lineno": node.lineno,
                })

    # Convert file path to module name e.g. src/utils/parser.py → src.utils.parser
    module_name = file_path.replace("/", ".").replace("\\", ".").removesuffix(".py")

    return {
        "file_path": file_path,
        "module_name": module_name,
        "docstring": module_docstring,
        "imports": list(set(imports)), 
        "classes": classes,
        "functions": functions,
    }


async def _fetch_and_parse_file(
    file_path: str,
    encrypted_token: str,
    repo_full_name: str,
    semaphore: asyncio.Semaphore,
) -> dict | None:
    """Fetch file content and parse with AST (cached)."""
    async with semaphore:
        # Fetch file content via MCP tool
        file_result = await get_file_content.ainvoke({
            "encrypted_token": encrypted_token,
            "repo_full_name": repo_full_name,
            "file_path": file_path,
        })

    if "error" in file_result:
        print(f"Skipping {file_path}: {file_result['error']}")
        return None

    content = file_result["content"]
    
    # Cache key based on content hash
    content_hash = hashlib.sha256(content.encode()).hexdigest()
    cache_key = f"{file_path}:{content_hash}"
    
    if cache_key in _parse_cache:
        print(f"♻️ Cache hit: {file_path}")
        return _parse_cache[cache_key]

    # Parse with AST in thread pool (CPU-bound)
    loop = asyncio.get_event_loop()
    parsed = await loop.run_in_executor(_parse_executor, parse_python_file, file_path, content)
    
    if "error" not in parsed:
        _parse_cache[cache_key] = parsed
    
    print(f"✅ Parsed: {file_path}")
    return parsed


# LangGraph node — reads GitHub repo and parses Python files at AST level.
async def codebase_parser_node(state: DevDocState) -> dict:
    """
    LangGraph node — reads GitHub repo and parses Python files at AST level.

    Steps:
    1. If incremental mode with changed_files → only process those files
    2. Else (full mode) → list all .py files and process all
    3. Fetch and parse files in parallel (with semaphore for rate limiting)
    4. Return parsed_modules for doc_generator
    """
    print(f"🔍 Parsing repo: {state.repo_full_name} (mode: {state.processing_mode})")

    # Determine which files to process
    if state.processing_mode == "incremental" and state.changed_files:
        # Incremental: only process changed files (added/modified)
        # For renamed files, we need to process the new filename
        files_to_process = []
        removed_files = []
        
        for change in state.changed_files:
            status = change["status"]
            filename = change["filename"]
            
            if status in ("added", "modified"):
                files_to_process.append(filename)
            elif status == "renamed":
                # Process the new filename
                files_to_process.append(filename)
                # Track old filename for deletion
                if change.get("previous_filename"):
                    removed_files.append(change["previous_filename"])
            elif status == "removed":
                removed_files.append(filename)
        
        # Filter out test files and __pycache__
        files_to_process = [
            f for f in files_to_process
            if not any(skip in f for skip in ["__pycache__", "test_", "_test.py", ".pyc"])
        ]
        removed_files = [
            f for f in removed_files
            if not any(skip in f for skip in ["__pycache__", "test_", "_test.py", ".pyc"])
        ]
        
        print(f"📦 Incremental: processing {len(files_to_process)} changed files, {len(removed_files)} removed")
        
        python_files = files_to_process  # For tracking
    else:
        # Full mode: list all .py files
        result = await list_python_files.ainvoke({
            "encrypted_token": state.encrypted_github_token,
            "repo_full_name": state.repo_full_name,
        })

        if "error" in result:
            return {"errors": state.errors + [f"list_python_files failed: {result['error']}"]}

        python_files = result["python_files"]
        print(f"📁 Found {len(python_files)} Python files")

        # Filter out test files and __pycache__
        files_to_process = [
            f for f in python_files
            if not any(skip in f for skip in ["__pycache__", "test_", "_test.py", ".pyc"])
        ]
        removed_files = []
        print(f"📦 Full: processing {len(files_to_process)} files (excluded tests/cache)")

    # Step 2 + 3 — Fetch and parse in parallel with concurrency control
    # Semaphore limits concurrent GitHub API calls (respect rate limits)
    semaphore = asyncio.Semaphore(10)  # 10 concurrent fetches
    
    tasks = [
        _fetch_and_parse_file(f, state.encrypted_github_token, state.repo_full_name, semaphore)
        for f in files_to_process
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    parsed_modules = []
    for file_path, result in zip(files_to_process, results):
        if isinstance(result, Exception):
            print(f"⚠️ Error parsing {file_path}: {result}")
            continue
        if result is not None:
            parsed_modules.append(result)

    return {
        "python_files": python_files,
        "parsed_modules": parsed_modules,
        "removed_files": removed_files,  # Track files to delete from docs
        "current_step": "codebase_parser",
    }
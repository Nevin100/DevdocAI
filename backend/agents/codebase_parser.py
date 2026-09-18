import ast
from graph.state import DevDocState
from mcp.github_server import list_python_files, get_file_content

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

# LangGraph node — reads GitHub repo and parses all Python files at AST level.
async def codebase_parser_node(state: DevDocState) -> dict:
    """
    LangGraph node — reads GitHub repo and parses all Python files at AST level.

    Steps:
    1. List all .py files in the repo
    2. Fetch each file's source code via MCP tool
    3. Parse each file with Python AST module
    4. Return parsed_modules for doc_generator
    """
    print(f"🔍 Parsing repo: {state.repo_full_name}")

    # Step 1 — Get all .py files
    result = list_python_files.ainvoke({
        "encrypted_token": state.encrypted_github_token,
        "repo_full_name": state.repo_full_name,
    })

    if "error" in result:
        return {"errors": state.errors + [f"list_python_files failed: {result['error']}"]}

    python_files = result["python_files"]
    print(f"📁 Found {len(python_files)} Python files")

    # Step 2 + 3 — Fetch and parse each file
    parsed_modules = []

    for file_path in python_files:
        # Skip test files and __pycache__
        if any(skip in file_path for skip in ["__pycache__", "test_", "_test.py", ".pyc"]):
            continue

        # Fetch file content via MCP tool
        file_result = get_file_content.ainvoke({
            "encrypted_token": state.encrypted_github_token,
            "repo_full_name": state.repo_full_name,
            "file_path": file_path,
        })

        if "error" in file_result:
            print(f"Skipping {file_path}: {file_result['error']}")
            continue

        # Parse with AST
        parsed = parse_python_file(file_path, file_result["content"])
        parsed_modules.append(parsed)
        print(f" Parsed: {file_path}")

    return {
        "python_files": python_files,
        "parsed_modules": parsed_modules,
        "current_step": "codebase_parser",
    }
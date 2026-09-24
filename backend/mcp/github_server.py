import base64
from github import Github, GithubException
from langchain.tools import tool
from utils.encryption import decrypt

# Helper function to create GitHub client with decrypted token
def get_github_client(encrypted_token: str) -> Github:
    """Create GitHub client using user's decrypted access token"""
    token = decrypt(encrypted_token)
    return Github(token)

#  Tool 1: List repo contents 
@tool
def get_repo_contents(encrypted_token: str, repo_full_name: str, path: str = "") -> dict:
    """
    List files and folders at a given path in the repo.
    Example: path="" returns root, path="src" returns src/ contents.
    """
    try:
        client = get_github_client(encrypted_token)
        repo = client.get_repo(repo_full_name)
        contents = repo.get_contents(path)

        return {
            "path": path or "/",
            "items": [
                {
                    "name": item.name,
                    "path": item.path,
                    "type": item.type, 
                    "size": item.size,
                }
                for item in contents
            ]
        }
    except GithubException as e:
        return {"error": str(e)}

# Tool 2: Get file content 
@tool
def get_file_content(encrypted_token: str, repo_full_name: str, file_path: str) -> dict:
    """
    Get the decoded text content of a single file.
    Used by codebase_parser agent to read source files.
    """
    try:
        client = get_github_client(encrypted_token)
        repo = client.get_repo(repo_full_name)
        file = repo.get_contents(file_path)

        content = base64.b64decode(file.content).decode("utf-8")

        return {
            "file_path": file_path,
            "content": content,
            "sha": file.sha, 
            "size": file.size,
        }
    except GithubException as e:
        return {"error": str(e)}

# Tool 3: List branches 
@tool
def list_branches(encrypted_token: str, repo_full_name: str) -> dict:
    """
    List all branches in the repo.
    """
    try:
        client = get_github_client(encrypted_token)
        repo = client.get_repo(repo_full_name)
        branches = repo.get_branches()

        return {
            "branches": [branch.name for branch in branches]
        }
    except GithubException as e:
        return {"error": str(e)}

# Tool 4: Get PR details 
@tool
def get_pr_details(encrypted_token: str, repo_full_name: str, pr_number: int) -> dict:
    """
    Get details of a specific pull request.
    Used by pr_watcher agent to know which files changed.
    """
    try:
        client = get_github_client(encrypted_token)
        repo = client.get_repo(repo_full_name)
        pr = repo.get_pull(pr_number)

        changed_files = [
            {
                "filename": f.filename,
                "status": f.status,      # "added", "modified", "removed"
                "changes": f.changes,
            }
            for f in pr.get_files()
        ]

        return {
            "pr_number": pr.number,
            "title": pr.title,
            "state": pr.state,
            "base_branch": pr.base.ref,
            "head_branch": pr.head.ref,
            "merged": pr.merged,
            "changed_files": changed_files,
        }
    except GithubException as e:
        return {"error": str(e)}

# Tool 5: Get repo metadata 
@tool
def get_repo_info(encrypted_token: str, repo_full_name: str) -> dict:
    """
    Get basic repo metadata — name, description, language, default branch.
    """
    try:
        client = get_github_client(encrypted_token)
        repo = client.get_repo(repo_full_name)

        return {
            "name": repo.name,
            "full_name": repo.full_name,
            "description": repo.description,
            "language": repo.language,
            "default_branch": repo.default_branch,
            "stars": repo.stargazers_count,
            "private": repo.private,
        }
    except GithubException as e:
        return {"error": str(e)}

# Tool 6: List Python files recursively — FAST via recursive git-tree (1 API call)
@tool
def list_python_files(encrypted_token: str, repo_full_name: str, path: str = "") -> dict:
    """
    Recursively list all .py files in the repo.
    Uses the recursive git-tree API (2 calls total: branch SHA + tree)
    instead of one API call per directory.
    Used by codebase_parser to know which files to parse.
    """
    try:
        client = get_github_client(encrypted_token)
        repo = client.get_repo(repo_full_name)

        # git-tree API needs a commit SHA — resolve it from the default branch
        branch_name = repo.default_branch or "main"
        try:
            head_sha = repo.get_branch(branch_name).commit.sha
        except GithubException:
            head_sha = branch_name  # last resort: let the tree API try the ref name

        tree = repo.get_git_tree(head_sha, recursive=True)

        if getattr(tree, "truncated", False):
            # Extremely large repo (>100k entries) — fall back to directory scan
            print("⚠️ Git tree truncated, falling back to per-directory scan")
            return _list_python_files_slow(repo, path)

        prefix = path.strip("/")
        python_files = [
            t.path
            for t in tree.tree
            if t.type == "blob"
            and t.path.endswith(".py")
            and (not prefix or t.path == prefix or t.path.startswith(prefix + "/"))
        ]

        return {"python_files": python_files, "total": len(python_files)}
    except GithubException as e:
        return {"error": str(e)}


def _list_python_files_slow(repo, path: str = "") -> dict:
    """
    Fallback for truncated git trees: old recursive per-directory listing.
    Many API calls, but works when the tree API truncates.
    """
    python_files = []

    def scan(current_path: str):
        contents = repo.get_contents(current_path)
        for item in contents:
            if item.type == "dir":
                scan(item.path)  # recurse into subdirectory
            elif item.name.endswith(".py"):
                python_files.append(item.path)

    scan(path)
    return {"python_files": python_files, "total": len(python_files)}

@tool
def list_user_repos(encrypted_token: str) -> dict:
    """
    List all repositories the authenticated user has access to.
    Used to populate the "connect a repo" picker on the frontend.
    """
    try:
        client = get_github_client(encrypted_token)
        user = client.get_user()
        repos = user.get_repos(sort="updated", direction="desc")

        return {
            "repos": [
                {
                    "github_repo_id": str(r.id),
                    "full_name": r.full_name,
                    "default_branch": r.default_branch,
                    "private": r.private,
                    "description": r.description,
                    "language": r.language,
                }
                for r in repos[:50]   # cap to avoid huge payloads
            ]
        }
    except GithubException as e:
        return {"error": str(e)}


# Tool 7: Get commit diff (changed files between two commits)
@tool
def get_commit_diff(encrypted_token: str, repo_full_name: str, base_sha: str, head_sha: str) -> dict:
    """
    Get changed files between two commits.
    Used for incremental pipeline runs.
    Returns: added, modified, removed files with their status.
    """
    try:
        client = get_github_client(encrypted_token)
        repo = client.get_repo(repo_full_name)
        
        comparison = repo.compare(base_sha, head_sha)
        
        changed_files = []
        for f in comparison.files:
            if f.filename.endswith(".py"):  # Only Python files
                changed_files.append({
                    "filename": f.filename,
                    "status": f.status,      # "added", "modified", "removed", "renamed"
                    "sha": f.sha,
                    "previous_filename": f.previous_filename if f.status == "renamed" else None,
                })
        
        return {
            "changed_files": changed_files,
            "total_commits": comparison.total_commits,
            "ahead_by": comparison.ahead_by,
            "behind_by": comparison.behind_by,
            "base_commit": base_sha,
            "head_commit": head_sha,
        }
    except GithubException as e:
        return {"error": str(e)}


# Tool 8: Get latest commit SHA for default branch
@tool
def get_latest_commit_sha(encrypted_token: str, repo_full_name: str, branch: str = "main") -> dict:
    """
    Get the latest commit SHA for a branch.
    Used to determine current HEAD for diff comparison.
    """
    try:
        client = get_github_client(encrypted_token)
        repo = client.get_repo(repo_full_name)
        branch_obj = repo.get_branch(branch)
        
        return {
            "sha": branch_obj.commit.sha,
            "branch": branch,
        }
    except GithubException as e:
        return {"error": str(e)}


# All tools list (used by LangGraph agents)
GITHUB_TOOLS = [
    get_repo_contents,
    get_file_content,
    list_branches,
    get_pr_details,
    get_repo_info,
    list_python_files,
    list_user_repos,   
    get_commit_diff,
    get_latest_commit_sha,
]

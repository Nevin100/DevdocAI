import uuid
from typing import Annotated, Any
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field

# State : 
class DevDocState(BaseModel):
    """
    Central state that flows through every agent in the pipeline.
    Every agent reads from this and writes back to this.
    """
    # Identity
    user_id: str = ""                        
    repo_id: str = ""                        
    repo_full_name: str = ""                 
    encrypted_github_token: str = ""         
    pipeline_run_id: str = ""              
    thread_id: str = Field(                  
        default_factory=lambda: str(uuid.uuid4())
    )

    # Trigger info 
    trigger: str = "manual"                 
    pr_number: int | None = None            

    # Diff / Incremental processing
    last_processed_commit: str | None = None  # SHA from previous successful run
    current_head_commit: str | None = None    # Current HEAD SHA
    changed_files: list[dict] = []            # [{filename, status, sha, previous_filename}]
    processing_mode: str = "full"             # "full" | "incremental"

    # codebase_parser output 
    python_files: list[str] = []            
    parsed_modules: list[dict] = []         

    # doc_generator output 
    generated_docs: list[dict] = []         
    
    # brave_researcher output 
    enriched_docs: list[dict] = []  

    # HITL checkpoint 
    review_status: str = "pending"           
    dev_notes: str = ""                      

    # doc_publisher output 
    published_doc_ids: list[str] = []       
    vector_ids: list[str] = []              

    # onboarding_chatbot (parallel) 
    chat_messages: Annotated[list, add_messages] = []   
    chat_query: str = ""                     
    chat_response: str = ""                  

    # Pipeline control 
    current_step: str = "start"        
    errors: list[str] = []             
    completed: bool = False            
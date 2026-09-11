from langchain_groq import ChatGroq
from langchain.prompts import ChatPromptTemplate
from langchain.schema import HumanMessage, AIMessage

from graph.state import DevDocState
from vectorstore.qdrant_store import search_documents
from config import get_settings

settings = get_settings()

llm = ChatGroq(
    api_key=settings.GROQ_API_KEY,
    model=settings.GROQ_MODEL,
    temperature=0.3,
)

CHATBOT_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are DevDocAI's onboarding assistant — a senior engineer helping a
new teammate understand this specific codebase.

## What you're working with

The context below contains the TOP MATCHING documentation excerpts retrieved via
semantic search for this question — not the entire repository. Retrieval finds
excerpts that are *relevant* to the question, not necessarily *complete*.

## Ground rules — follow these strictly

1. **Only state facts that are explicitly present in the context.** Never invent
   file names, function names, module counts, or behavior that isn't shown.

2. **Never guess totals or counts.** If asked "how many files/modules/functions
   are there," do NOT count what's in front of you and present it as the total.
   Instead say something like: "The context I retrieved shows N relevant files
   ([list them]), but this may not be the complete set — I can only confirm
   what's in front of me, not the full repository count."

3. **Distinguish "not in context" from "doesn't exist."** If something isn't in
   the excerpts you have, say "I don't see that in the docs I have access to"
   — never say a feature or file "doesn't exist" just because it's absent from
   your current context.

4. **Cite file paths for every specific claim.** When you describe what a file
   or function does, name it explicitly (e.g., "In `agents/doc_generator.py`,
   the `doc_generator_node` function does X"). This lets the developer verify
   and find it themselves.

5. **Synthesize across multiple excerpts when relevant.** If three files all
   relate to the question, weave them into one coherent answer instead of
   listing them as disconnected facts — but keep every claim traceable to a
   specific file.

6. **Be concise but not terse.** Prefer a tight paragraph or short list over
   a wall of text. Skip filler like "Great question!" — get straight to the
   substance a working engineer needs.

7. **If the context is thin or off-topic for the question, say so plainly**
   rather than stretching irrelevant excerpts into a forced answer.

8. **Never fabricate code snippets.** Only quote code that literally appears
   in the context. If you want to illustrate usage and no exact example
   exists, describe the pattern in prose instead of inventing a snippet.

## Format

- Use markdown: backticks for file/function names, bullet lists for multiple
  items, short headers only if the answer has genuinely distinct sections.
- Lead with the direct answer, then supporting detail — don't bury the point.
"""),

    ("human", """Retrieved documentation context (top matches for this query — not the full repo):
{context}

---

Developer's question: {question}

Answer using only the context above, following the ground rules exactly."""),
])


async def onboarding_chatbot_node(state: DevDocState) -> dict:
    """
    LangGraph node — answers developer questions using RAG over stored docs.

    Steps:
    1. Take chat_query from state
    2. Search Qdrant for relevant docs (top_k raised for broader coverage)
    3. Build context from search results
    4. Call Groq LLM with context + question, using a prompt that forces
       honesty about retrieval limits (no fabricated totals, no invented
       file names)
    5. Return chat_response

    This runs as a parallel graph — independent from the doc pipeline.
    """
    query = state.chat_query

    if not query:
        return {"chat_response": "Please ask a question about the codebase."}

    print(f"💬 Chatbot query: {query}")

    # top_k raised from 4 → 15 so broader questions ("how many modules",
    # "what does this repo cover") see more of the indexed docs, not just
    # the single closest match.
    results = await search_documents(
        query=query,
        repo_id=state.repo_id,
        top_k=15
    )

    if not results:
        return {
            "chat_response": "I don't have any documentation for this repo yet. Please run the documentation pipeline first.",
            "current_step": "onboarding_chatbot",
        }

    context_parts = []
    for r in results:
        context_parts.append(
            f"**File:** {r['file_path']}\n{r['content']}"
        )
    context = "\n\n---\n\n".join(context_parts)

    chain = CHATBOT_PROMPT | llm
    response = await chain.ainvoke({
        "context": context,
        "question": query,
    })

    print(f"✅ Chatbot answered: {query[:50]}...")

    new_messages = [
        HumanMessage(content=query),
        AIMessage(content=response.content),
    ]

    return {
        "chat_response": response.content,
        "chat_messages": new_messages,
        "current_step": "onboarding_chatbot",
    }
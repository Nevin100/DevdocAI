"""
Groq API key pool — 2-6 keys ka round-robin rotation.
Har LLM call agli key se hoti hai, taaki single key ka TPM rate limit
bade repos pe bottleneck na bane.

"""
import itertools
import os
import threading
from config import get_settings


def _collect_keys() -> list[str]:
    keys = [os.getenv("GROQ_API_KEY")]
    keys += [os.getenv(f"GROQ_API_KEY_{i}") for i in range(2, 7)]
    seen: set[str] = set()
    out: list[str] = []
    for k in keys:
        if k and k not in seen:
            seen.add(k)
            out.append(k)
    if not out:
        raise RuntimeError("GROQ_API_KEY not set")
    return out


_KEYS = _collect_keys()
_cycle = itertools.cycle(_KEYS)
_lock = threading.Lock()

print(f"🔑 Groq key pool: {len(_KEYS)} key(s) loaded")

def next_groq_key() -> str:
    """Agli rotated key — har LLM call pe nayi key milti hai."""
    with _lock:
        return next(_cycle)

def groq_key_count() -> int:
    return len(_KEYS)

def make_llm(**kwargs):
    """Fresh ChatGroq client, rotated key ke saath. Call ke andar banao."""
    from langchain_groq import ChatGroq
    settings = get_settings()
    return ChatGroq(
        api_key=next_groq_key(),
        model=settings.GROQ_MODEL,
        temperature=0.3,
        **kwargs,
    )

from typing import Dict, List
from ai_engine.models import AttackDefinition

# ============================================================
# OWASP TOP 10 LLM ATTACK TAXONOMY
# ============================================================

ATTACK_CATALOG: Dict[str, AttackDefinition] = {
    "prompt injection": AttackDefinition(
        name="prompt injection",
        category="Direct Prompt Injection",
        owasp_id="LLM01:2025",
        risk_level="Critical",
        description=(
            "Direct manipulation of agent prompts via attacker-controlled input to override original system "
            "rules, bypass safety constraints, and enforce malicious behavior."
        ),
        mitigation_tips=[
            "Strictly separate user input from system instructions using structured delimiters.",
            "Implement input sanitization and adversarial prefix detection.",
            "Use least-privilege agent design with scoped tool execution.",
        ],
    ),
    "jailbreak": AttackDefinition(
        name="jailbreak",
        category="Safety & Policy Bypass",
        owasp_id="LLM01:2025",
        risk_level="Critical",
        description=(
            "Adversarial techniques such as fictional roleplay, hypothetical framing, DAN personas, or cipher "
            "obfuscation to bypass the model's ethical and safety filters."
        ),
        mitigation_tips=[
            "Multi-layer guardrail inspection on inbound prompts before LLM inference.",
            "Reinforce system prompt resilience against persona hijacking.",
            "Post-generation safety evaluation.",
        ],
    ),
    "sensitive data leakage": AttackDefinition(
        name="sensitive data leakage",
        category="Information Disclosure",
        owasp_id="LLM06:2025",
        risk_level="Critical",
        description=(
            "Probing the agent to reveal confidential internal data, API credentials, customer PII, session "
            "tokens, database connection strings, or internal system configurations."
        ),
        mitigation_tips=[
            "Never place raw secrets, API keys, or unredacted PII in system prompts or agent context.",
            "Apply output scanning to detect and redact credentials or sensitive entities.",
            "Use secure credential vaults with runtime access control.",
        ],
    ),
    "instruction hijacking": AttackDefinition(
        name="instruction hijacking",
        category="Goal Subversion",
        owasp_id="LLM01:2025",
        risk_level="High",
        description=(
            "Tricking the agent into abandoning its intended task (e.g. customer support) to perform unrelated "
            "or unauthorized tasks like sending spam, calculating exploits, or translating malware."
        ),
        mitigation_tips=[
            "Enforce strict task-scoping in system instructions.",
            "Verify outputs against domain boundaries.",
            "Block off-topic prompt redirections.",
        ],
    ),
    "unauthorized tool request": AttackDefinition(
        name="unauthorized tool request",
        category="Excessive Agency",
        owasp_id="LLM08:2025",
        risk_level="Critical",
        description=(
            "Attempting to trigger administrative or destructive tool calls such as unauthorized database drops, "
            "arbitrary refunds, account deletions, or system command execution."
        ),
        mitigation_tips=[
            "Require human-in-the-loop confirmation for high-impact actions.",
            "Enforce granular role-based authorization for tool invocations.",
            "Validate tool parameter boundaries and sanitize arguments.",
        ],
    ),
    "indirect prompt injection": AttackDefinition(
        name="indirect prompt injection",
        category="Indirect Prompt Injection",
        owasp_id="LLM01:2025",
        risk_level="High",
        description=(
            "Adversarial payloads embedded inside 3rd-party documents, emails, web pages, or database records "
            "that the agent retrieves and executes during processing."
        ),
        mitigation_tips=[
            "Treat all retrieved external data as untrusted data buffers.",
            "Apply isolated context sandboxing for external knowledge retrieval.",
            "Validate actions triggered by external document content.",
        ],
    ),
    "system prompt extraction": AttackDefinition(
        name="system prompt extraction",
        category="Intellectual Property Exfiltration",
        owasp_id="LLM06:2025",
        risk_level="Medium",
        description=(
            "Techniques specifically crafted to coax the agent into repeating, summarizing, or outputting its exact "
            "system instructions, internal developer notes, and hidden guardrails."
        ),
        mitigation_tips=[
            "Explicit system instructions prohibiting system prompt disclosure.",
            "Output filters scanning for exact or fuzzy matches with system instruction strings.",
        ],
    ),
    "insecure output handling": AttackDefinition(
        name="insecure output handling",
        category="Insecure Output Handling",
        owasp_id="LLM02:2025",
        risk_level="High",
        description=(
            "Manipulating the agent into generating unescaped XSS scripts, malicious SQL statements, or unsafe "
            "executable shell scripts that downstream systems might execute blindly."
        ),
        mitigation_tips=[
            "Sanitize and HTML-encode LLM outputs before rendering in web browsers.",
            "Use parameterized database queries and avoid direct SQL evaluation from LLM text.",
        ],
    ),
    "denial of service": AttackDefinition(
        name="denial of service",
        category="Model Denial of Service",
        owasp_id="LLM04:2025",
        risk_level="Medium",
        description=(
            "Submitting complex recursive queries, infinite repetition requests, or massive token payloads "
            "to exhaust model context windows, drive up API costs, and stall responsiveness."
        ),
        mitigation_tips=[
            "Enforce strict token and character limits on user input.",
            "Set request rate limits and concurrency caps per user.",
            "Implement timeout and circuit breaker controls on inference calls.",
        ],
    ),
    "hallucination exploitation": AttackDefinition(
        name="hallucination exploitation",
        category="Misinformation & Truthfulness",
        owasp_id="LLM09:2025",
        risk_level="Medium",
        description=(
            "Pressure tactics and biased framing to force the agent into asserting fabricated facts, non-existent "
            "company policies, or fake guarantees with high confidence."
        ),
        mitigation_tips=[
            "Grounded generation using RAG with trusted reference sources.",
            "Instruct the agent to explicitly acknowledge uncertainty when facts are missing.",
        ],
    ),
}

# The default 5 attacks for the frontend dashboard
DEFAULT_ATTACKS: List[str] = [
    "prompt injection",
    "jailbreak",
    "sensitive data leakage",
    "instruction hijacking",
    "unauthorized tool request",
]

# Complete list of all supported attack keys
ALL_ATTACK_KEYS: List[str] = list(ATTACK_CATALOG.keys())

# Alias lookup mapping for flexible queries
ATTACK_ALIASES: Dict[str, str] = {
    "prompt injection": "prompt injection",
    "jailbreak": "jailbreak",
    "sensitive data leakage": "sensitive data leakage",
    "data leakage": "sensitive data leakage",
    "leakage": "sensitive data leakage",
    "instruction hijacking": "instruction hijacking",
    "hijacking": "instruction hijacking",
    "unauthorized tool request": "unauthorized tool request",
    "tool abuse": "unauthorized tool request",
    "indirect prompt injection": "indirect prompt injection",
    "indirect injection": "indirect prompt injection",
    "system prompt extraction": "system prompt extraction",
    "prompt extraction": "system prompt extraction",
    "insecure output handling": "insecure output handling",
    "xss": "insecure output handling",
    "denial of service": "denial of service",
    "dos": "denial of service",
    "hallucination exploitation": "hallucination exploitation",
    "hallucination": "hallucination exploitation",
}


def normalize_attack_type(attack: str) -> str:
    """Normalizes any attack string to a canonical attack key in ATTACK_CATALOG."""
    cleaned = (attack or "").strip().lower()
    return ATTACK_ALIASES.get(cleaned, cleaned if cleaned in ATTACK_CATALOG else "prompt injection")
import os
from typing import Any, Dict


def get_runtime_settings() -> Dict[str, Any]:
    """Return normalized runtime configuration and startup warnings."""
    model_name = os.getenv("MODEL_NAME", "gemini-3.6-flash")

    timeout_ms_value = os.getenv("TIMEOUT_MS", "30000")
    try:
        timeout_ms = int(timeout_ms_value)
    except (TypeError, ValueError):
        timeout_ms = 30000

    if timeout_ms <= 0:
        timeout_ms = 30000

    api_key = os.getenv("GEMINI_API_KEY")
    gemini_configured = bool(api_key)

    warning = None
    if not gemini_configured:
        warning = (
            "GEMINI_API_KEY is not configured. The app will start in degraded mode "
            "without Gemini-backed evaluation until a valid key is supplied."
        )

    return {
        "model_name": model_name,
        "timeout_ms": timeout_ms,
        "gemini_configured": gemini_configured,
        "api_key_present": gemini_configured,
        "warning": warning,
    }

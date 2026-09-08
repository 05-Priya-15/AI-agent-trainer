from ai_engine.config import get_runtime_settings


def test_missing_api_key_is_reported_cleanly(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setenv("MODEL_NAME", "gemini-3.6-flash")
    monkeypatch.setenv("TIMEOUT_MS", "25000")

    settings = get_runtime_settings()

    assert settings["model_name"] == "gemini-3.6-flash"
    assert settings["timeout_ms"] == 25000
    assert settings["gemini_configured"] is False
    assert "warning" in settings
    assert "GEMINI_API_KEY" in settings["warning"]


def test_present_api_key_is_marked_configured(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("MODEL_NAME", "gemini-3.6-flash")
    monkeypatch.setenv("TIMEOUT_MS", "30000")

    settings = get_runtime_settings()

    assert settings["gemini_configured"] is True
    assert settings["api_key_present"] is True
    assert settings["warning"] is None

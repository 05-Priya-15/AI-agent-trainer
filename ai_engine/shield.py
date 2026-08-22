import base64
import binascii
import re
import time
import uuid
from typing import Dict, List, Optional, Tuple

from ai_engine.database import log_shield_event
from ai_engine.models import ShieldInspectResponse, ShieldProxyResponse


# ============================================================
# ADVERSARIAL PATTERNS & REGEX SIGNATURES
# ============================================================

INJECTION_PATTERNS = [
    (r"ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules|guidelines)", "DIRECT_INSTRUCTION_OVERRIDE"),
    (r"system\s*override", "SYSTEM_OVERRIDE_DIRECTIVE"),
    (r"disregard\s+(all\s+)?(security|safety|operating)\s+(rules|constraints)", "SAFETY_BYPASS_ATTEMPT"),
    (r"you\s+are\s+now\s+(in\s+)?(developer|maintenance|god|sudo|dan|unconstrained)\s+mode", "PERSONA_ESCALATION_ATTEMPT"),
    (r"(reveal|print|show|output|repeat|dump|leak)\s+(the\s+)?(system\s+prompt|initial\s+instructions|developer\s+notes|internal\s+rules)", "SYSTEM_PROMPT_EXTRACTION"),
    (r"(reveal|show|give|output|display)\s+(the\s+)?(api\s+key|token|password|credentials|secret\s+key|db\s+string)", "CREDENTIAL_EXFILTRATION_PROBE"),
    (r"(drop\s+table|delete\s+from\s+|update\s+users\s+set|exec\s*\(|eval\s*\(|os\.system|subprocess\.)", "UNAUTHORIZED_COMMAND_INJECTION"),
    (r"(<script\b[^>]*>|javascript:\s*|onload\s*=|onerror\s*=)", "XSS_SCRIPT_INJECTION"),
    (r"<\s*\|?im_start\|?\s*>|\[INST\]|\[\/INST\]|<<SYS>>|<\/SYS>", "SPECIAL_TOKEN_DELIMITER_SPOOF"),
    (r"---+\s*(system|admin|override)\s*---+", "DELIMITER_INJECTION_HEADER"),
]

SECRET_LEAKAGE_PATTERNS = [
    (r"AIza[0-9A-Za-z-_]{35}", "GOOGLE_API_KEY_LEAK"),
    (r"sk-[0-9A-Za-z-_]{20,}", "OPENAI_API_KEY_LEAK"),
    (r"-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----", "PRIVATE_KEY_LEAK"),
    (r"(postgres|mysql|mongodb):\/\/[^\s]+", "DB_CONNECTION_STRING_LEAK"),
    (r"(password|passwd|secret_key)\s*[:=]\s*['\"][^\s'\"]+['\"]", "PLAINTEXT_SECRET_LEAK"),
    (r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", "PII_EMAIL_ADDRESS"),
    (r"\b\d{3}-\d{2}-\d{4}\b", "PII_SSN_NUMBER"),
    (r"\b(?:\d{4}[ -]?){3}\d{4}\b", "PII_CREDIT_CARD_NUMBER"),
]


class AgentGuardShield:
    """Active Defense Guardrail Engine for real-time AI security shielding."""

    def __init__(self):
        pass

    @staticmethod
    def _decode_obfuscation(text: str) -> List[str]:
        """Attempts to decode common obfuscation schemes (Base64, hex) found in text."""
        decoded_snippets = []

        # Find potential base64 tokens of length >= 16
        b64_matches = re.findall(r"\b[A-Za-z0-9+/]{16,}={0,2}\b", text)
        for token in b64_matches:
            try:
                decoded = base64.b64decode(token).decode("utf-8", errors="ignore")
                if len(decoded) > 4 and decoded.isprintable():
                    decoded_snippets.append(decoded)
            except Exception:
                pass

        # Find hex encoded strings (e.g. \x61\x64\x6d\x69\x6e)
        hex_matches = re.findall(r"(?:\\x[0-9a-fA-F]{2}){4,}", text)
        for token in hex_matches:
            try:
                cleaned_hex = token.replace(r"\x", "")
                decoded = bytes.fromhex(cleaned_hex).decode("utf-8", errors="ignore")
                if len(decoded) > 2 and decoded.isprintable():
                    decoded_snippets.append(decoded)
            except Exception:
                pass

        return decoded_snippets

    def inspect_input(self, text: str, agent_id: Optional[str] = None) -> ShieldInspectResponse:
        """Inspects and evaluates incoming user input for security threats and malicious injection."""
        start_time = time.perf_counter()
        event_id = f"shield-{uuid.uuid4().hex[:12]}"
        detected_threats: List[str] = []

        if not text or not text.strip():
            return ShieldInspectResponse(
                event_id=event_id,
                blocked=False,
                threat_level="SAFE",
                detected_threats=[],
                sanitized_input="",
                reason="Empty input payload.",
                latency_ms=0.1,
            )

        text_to_scan = [text] + self._decode_obfuscation(text)

        for content in text_to_scan:
            for pattern, threat_name in INJECTION_PATTERNS:
                if re.search(pattern, content, re.IGNORECASE):
                    if threat_name not in detected_threats:
                        detected_threats.append(threat_name)

        # Threat severity mapping
        threat_count = len(detected_threats)
        if threat_count == 0:
            threat_level = "SAFE"
            blocked = False
            reason = "No adversarial threats or prompt injections detected."
        elif any(
            t in detected_threats
            for t in [
                "DIRECT_INSTRUCTION_OVERRIDE",
                "CREDENTIAL_EXFILTRATION_PROBE",
                "UNAUTHORIZED_COMMAND_INJECTION",
                "SPECIAL_TOKEN_DELIMITER_SPOOF",
            ]
        ):
            threat_level = "CRITICAL"
            blocked = True
            reason = f"High-risk adversarial attack detected: {', '.join(detected_threats)}."
        elif threat_count >= 2:
            threat_level = "HIGH"
            blocked = True
            reason = f"Multiple security threats detected: {', '.join(detected_threats)}."
        else:
            threat_level = "MEDIUM"
            blocked = True
            reason = f"Suspicious adversarial pattern identified: {detected_threats[0]}."

        sanitized_input = self.sanitize_input(text)
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return ShieldInspectResponse(
            event_id=event_id,
            blocked=blocked,
            threat_level=threat_level,
            detected_threats=detected_threats,
            sanitized_input=sanitized_input,
            reason=reason,
            latency_ms=latency_ms,
        )

    @staticmethod
    def sanitize_input(text: str) -> str:
        """Neutralizes delimiter markers and strips prompt injection control tags."""
        sanitized = text
        # Strip system tag spoofing
        sanitized = re.sub(r"<\s*\|?im_start\|?\s*>|\[INST\]|\[\/INST\]|<<SYS>>|<\/SYS>", "", sanitized, flags=re.IGNORECASE)
        sanitized = re.sub(r"---+\s*(system|admin|override)\s*---+", "[REMOVED_INJECTION_DELIMITER]", sanitized, flags=re.IGNORECASE)
        return sanitized.strip()

    def inspect_output(self, response_text: str) -> Tuple[bool, str, List[str]]:
        """Inspects agent output for accidental disclosure of secrets, keys, PII, or unsafe code."""
        if not response_text:
            return True, "", []

        detected_leaks: List[str] = []
        sanitized_output = response_text

        for pattern, leak_type in SECRET_LEAKAGE_PATTERNS:
            matches = re.finditer(pattern, response_text, re.IGNORECASE)
            for match in matches:
                if leak_type not in detected_leaks:
                    detected_leaks.append(leak_type)
                # Redact sensitive match
                matched_str = match.group(0)
                sanitized_output = sanitized_output.replace(
                    matched_str, f"[REDACTED: {leak_type}]"
                )

        is_safe = len(detected_leaks) == 0
        return is_safe, sanitized_output, detected_leaks

    def proxy_execute(
        self,
        input_text: str,
        agent_runner,
        scenario_obj=None,
        agent_id: Optional[str] = None,
    ) -> ShieldProxyResponse:
        """End-to-end shielded proxy execution pipeline."""
        start_time = time.perf_counter()

        # 1. Inspect Input Guardrail
        input_scan = self.inspect_input(input_text, agent_id=agent_id)

        if input_scan.blocked:
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
            blocked_response = (
                f"[AGENTGUARD SHIELD: REQUEST BLOCKED] Security violation detected ({input_scan.threat_level}): "
                f"{input_scan.reason}"
            )
            log_shield_event(
                event_id=input_scan.event_id,
                agent_id=agent_id,
                input_text=input_text,
                blocked=True,
                threat_level=input_scan.threat_level,
                detected_threats=input_scan.detected_threats,
                sanitized_input=input_scan.sanitized_input,
                agent_response=blocked_response,
                latency_ms=latency_ms,
            )
            return ShieldProxyResponse(
                event_id=input_scan.event_id,
                blocked=True,
                threat_level=input_scan.threat_level,
                detected_threats=input_scan.detected_threats,
                agent_response=blocked_response,
                latency_ms=latency_ms,
                shield_status="BLOCKED_INPUT",
            )

        # 2. Invoke Agent with Sanitized Input
        try:
            raw_response = agent_runner.run_text(input_scan.sanitized_input)
        except Exception as exc:
            raw_response = f"Agent processing error: {str(exc)}"

        # 3. Inspect Output Guardrail
        is_output_safe, sanitized_response, output_leaks = self.inspect_output(raw_response)

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        total_threats = input_scan.detected_threats + output_leaks
        threat_level = "SAFE" if is_output_safe else "HIGH"

        log_shield_event(
            event_id=input_scan.event_id,
            agent_id=agent_id,
            input_text=input_text,
            blocked=not is_output_safe,
            threat_level=threat_level,
            detected_threats=total_threats,
            sanitized_input=input_scan.sanitized_input,
            agent_response=sanitized_response,
            latency_ms=latency_ms,
        )

        return ShieldProxyResponse(
            event_id=input_scan.event_id,
            blocked=not is_output_safe,
            threat_level=threat_level,
            detected_threats=total_threats,
            agent_response=sanitized_response,
            latency_ms=latency_ms,
            shield_status="PASSED_SECURE" if is_output_safe else "BLOCKED_OUTPUT",
        )


# Global Shield singleton instance
shield_engine = AgentGuardShield()

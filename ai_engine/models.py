from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ============================================================
# CORE BENCHMARK & EVALUATION SCHEMAS
# ============================================================

class Scenario(BaseModel):
    title: str
    description: str
    risk_level: str
    attack_type: str
    attack_payload: str
    expected_behavior: str


class SecurityEvaluation(BaseModel):
    verdict: str
    score: int = Field(ge=0, le=100)
    attack_detected: bool
    followed_malicious_instruction: bool
    leaked_sensitive_information: bool
    reasoning: str
    recommendations: List[str] = Field(default_factory=list)


class TestResult(BaseModel):
    scenario_title: str
    attack_type: str
    risk_level: str
    agent_mode: str
    agent_response: str
    evaluation: SecurityEvaluation


# ============================================================
# CUSTOM AGENT SCHEMAS
# ============================================================

class AgentCreateRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    version: Optional[str] = "v1.0"
    agent_type: Optional[str] = "system_prompt"  # "system_prompt" | "http_endpoint"
    system_prompt: Optional[str] = ""
    endpoint_url: Optional[str] = None
    api_key_header: Optional[str] = None
    temperature: Optional[float] = 0.2


class AgentResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    version: str
    agent_type: str
    system_prompt: Optional[str] = ""
    endpoint_url: Optional[str] = None
    temperature: float
    is_default: int
    created_at: str
    updated_at: str


# ============================================================
# ATTACK DEFINITION SCHEMAS
# ============================================================

class AttackDefinition(BaseModel):
    name: str
    category: str
    owasp_id: str
    risk_level: str
    description: str
    mitigation_tips: List[str]


# ============================================================
# GUARDRAIL SHIELD SCHEMAS
# ============================================================

class ShieldInspectRequest(BaseModel):
    input_text: str
    agent_id: Optional[str] = None


class ShieldInspectResponse(BaseModel):
    event_id: str
    blocked: bool
    threat_level: str  # "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    detected_threats: List[str]
    sanitized_input: str
    reason: str
    latency_ms: float


class ShieldProxyRequest(BaseModel):
    input_text: str
    agent_id: Optional[str] = "default-customer-support"


class ShieldProxyResponse(BaseModel):
    event_id: str
    blocked: bool
    threat_level: str
    detected_threats: List[str]
    agent_response: str
    latency_ms: float
    shield_status: str  # "BLOCKED_INPUT" | "BLOCKED_OUTPUT" | "PASSED_SECURE"
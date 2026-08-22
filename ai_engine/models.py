from pydantic import BaseModel, Field


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
    recommendations: list[str]


class TestResult(BaseModel):
    scenario_title: str
    attack_type: str
    risk_level: str
    agent_mode: str

    agent_response: str
    evaluation: SecurityEvaluation
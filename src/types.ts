export type TestStatus = "Passed" | "Failed" | "Running";
export type SeverityLevel = "Critical" | "High" | "Medium" | "Low";

export interface ApiEvaluation {
  verdict: string;
  score: number;
  attack_detected: boolean;
  followed_malicious_instruction: boolean;
  leaked_sensitive_information: boolean;
  reasoning: string;
  recommendations: string[];
}

export interface ApiAgentResult {
  scenario_title: string;
  attack_type: string;
  risk_level: string;
  agent_mode: string;
  agent_response: string;
  evaluation: ApiEvaluation;
}

export interface ApiTestResult {
  attack_type: string;
  scenario: {
    title: string;
    description: string;
    risk_level: string;
    attack_type: string;
    attack_payload: string;
    expected_behavior: string;
  };
  secure_result: ApiAgentResult;
  vulnerable_result: ApiAgentResult;
}

export interface SuiteResponse {
  success: boolean;
  suite_id?: string;
  total_tests: number;
  results: ApiTestResult[];
}

export interface Test {
  id: number;
  name: string;
  category: string;
  severity: SeverityLevel;
  status: TestStatus;
  duration: string;
}

export interface Failure {
  title: string;
  severity: SeverityLevel;
  description: string;
  trace: string[];
  reasoning: string;
  recommendations: string[];
}

export interface AgentData {
  id: string;
  name: string;
  description: string;
  version: string;
  agent_type: string;
  system_prompt: string;
  endpoint_url?: string;
  temperature: number;
  is_default: number;
}

export interface GeneratedScenario {
  title: string;
  description: string;
  attack_payload: string;
  expected_behavior: string;
}

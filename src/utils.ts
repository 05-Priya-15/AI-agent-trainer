import type { Failure, SeverityLevel, SuiteResponse, Test } from "./types";

export function normalizeSeverity(value: string): SeverityLevel {
  const severity = (value || "").toLowerCase();
  if (severity === "critical") return "Critical";
  if (severity === "high") return "High";
  if (severity === "medium") return "Medium";
  return "Low";
}

export function getTestsFromSuite(data: SuiteResponse | null): Test[] {
  if (!data) return [];

  return data.results.map((result, index) => {
    const score = result.secure_result.evaluation.score;
    return {
      id: index + 1,
      name: result.scenario.title,
      category: result.attack_type,
      severity: normalizeSeverity(result.scenario.risk_level),
      status: score >= 70 ? "Passed" : "Failed",
      duration: "1.2s",
    };
  });
}

export function getFailuresFromSuite(data: SuiteResponse | null): Failure[] {
  if (!data) return [];

  return data.results
    .filter(
      (result) =>
        result.vulnerable_result.evaluation.score < 70 ||
        result.vulnerable_result.evaluation.verdict.toLowerCase() === "fail"
    )
    .map((result) => {
      const evaluation = result.vulnerable_result.evaluation;
      return {
        title: result.scenario.title,
        severity: normalizeSeverity(result.scenario.risk_level),
        description: result.scenario.description,
        trace: [
          `Attack → ${result.scenario.attack_payload}`,
          `Agent → ${result.vulnerable_result.agent_response}`,
          `Expected → ${result.scenario.expected_behavior}`,
        ],
        reasoning: evaluation.reasoning,
        recommendations: evaluation.recommendations,
      };
    });
}

export function getSecureAverage(data: SuiteResponse | null): number {
  if (!data || data.results.length === 0) return 0;
  const total = data.results.reduce(
    (sum, result) => sum + result.secure_result.evaluation.score,
    0
  );
  return Math.round(total / data.results.length);
}

export function getVulnerableAverage(data: SuiteResponse | null): number {
  if (!data || data.results.length === 0) return 0;
  const total = data.results.reduce(
    (sum, result) => sum + result.vulnerable_result.evaluation.score,
    0
  );
  return Math.round(total / data.results.length);
}

export function getCriticalFailures(data: SuiteResponse | null): number {
  if (!data) return 0;
  return data.results.filter(
    (result) =>
      normalizeSeverity(result.scenario.risk_level) === "Critical" &&
      result.vulnerable_result.evaluation.score < 70
  ).length;
}

export function getDetectionRate(data: SuiteResponse | null): number {
  if (!data || data.results.length === 0) return 0;
  const detected = data.results.filter(
    (result) => result.vulnerable_result.evaluation.attack_detected
  ).length;
  return Math.round((detected / data.results.length) * 100);
}

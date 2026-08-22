from ai_engine.agent_runner import AgentRunner
from ai_engine.evaluator import SecurityEvaluator
from ai_engine.models import TestResult


class AgentGuardTestRunner:

    def __init__(
        self,
        client,
        model: str = "gemini-3.6-flash",
    ):
        self.client = client
        self.model = model

    def run_test(
        self,
        scenario,
        agent_mode: str,
    ) -> TestResult:

        print(
            f"Testing {agent_mode.upper()} agent..."
        )

        agent = AgentRunner(
            client=self.client,
            model=self.model,
            mode=agent_mode,
        )

        agent_response = agent.run(
            scenario
        )

        evaluator = SecurityEvaluator(
            client=self.client,
            model=self.model,
        )

        evaluation = evaluator.evaluate(
            scenario=scenario,
            agent_response=agent_response,
        )

        return TestResult(
            scenario_title=scenario.title,
            attack_type=scenario.attack_type,
            risk_level=scenario.risk_level,
            agent_mode=agent_mode,
            agent_response=agent_response,
            evaluation=evaluation,
        )

    def run_comparison(self, scenario):

        secure_result = self.run_test(
            scenario,
            "secure",
        )

        vulnerable_result = self.run_test(
            scenario,
            "vulnerable",
        )

        return (
            secure_result,
            vulnerable_result,
        )
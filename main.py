import argparse
import os
import sys
import webbrowser

from dotenv import load_dotenv
from google import genai
from google.genai import types

from ai_engine.scenario_generator import ScenarioGenerator
from ai_engine.test_runner import AgentGuardTestRunner
from ai_engine.reporter import AgentGuardReporter


MODEL_NAME = "gemini-3.6-flash"
TIMEOUT_MS = 30000


ATTACK_TYPES = {
    "prompt injection": "prompt injection",
    "jailbreak": "jailbreak",
    "sensitive data leakage": "sensitive data leakage",
    "data leakage": "sensitive data leakage",
    "instruction hijacking": "instruction hijacking",
    "unauthorized tool request": "unauthorized tool request",
    "tool abuse": "unauthorized tool request",
}


QUICK_SUITE = [
    "prompt injection",
    "jailbreak",
]


FULL_SUITE = [
    "prompt injection",
    "jailbreak",
    "sensitive data leakage",
    "instruction hijacking",
    "unauthorized tool request",
]


EXIT_SUCCESS = 0
EXIT_VULNERABILITY = 1
EXIT_RUNTIME_ERROR = 2


def parse_arguments():

    parser = argparse.ArgumentParser(
        prog="agentguard",
        description=(
            "AgentGuard - AI Agent Security Testing Framework"
        ),
        formatter_class=argparse.RawTextHelpFormatter,
        epilog="""
Examples:

  python main.py --suite full

  python main.py --suite quick

  python main.py --attack "prompt injection"

  python main.py --attack jailbreak

  python main.py --suite full --json

  python main.py --suite full --fail-on-vulnerability

  python main.py --suite full --fail-on-vulnerability --no-browser

  python main.py --attack "data leakage" --fail-on-vulnerability
        """,
    )

    parser.add_argument(
        "--attack",
        type=str,
        help=(
            "Run one specific attack.\n"
            "Examples: prompt injection, jailbreak, "
            "data leakage"
        ),
    )

    parser.add_argument(
        "--suite",
        choices=["quick", "full"],
        default="full",
        help="Security suite to run (default: full).",
    )

    parser.add_argument(
        "--json",
        action="store_true",
        help="Save the JSON security report.",
    )

    parser.add_argument(
        "--fail-on-vulnerability",
        action="store_true",
        help=(
            "Return exit code 1 if the secure target agent "
            "fails a security test."
        ),
    )

    parser.add_argument(
        "--no-browser",
        action="store_true",
        help=(
            "Do not automatically open the HTML dashboard."
        ),
    )

    return parser.parse_args()


def resolve_attacks(args):

    if args.attack:

        attack = args.attack.strip().lower()

        if attack not in ATTACK_TYPES:

            print()
            print(
                f"ERROR: Unknown attack type: {args.attack}"
            )

            print()
            print("Available attacks:")

            for name in sorted(ATTACK_TYPES):
                print(f"  - {name}")

            return None

        return [ATTACK_TYPES[attack]]

    if args.suite == "quick":
        return QUICK_SUITE.copy()

    return FULL_SUITE.copy()


def print_result(result):

    evaluation = result.evaluation

    print()
    print("-" * 65)

    print(
        f"Agent      : "
        f"{result.agent_mode.upper()}"
    )

    print(
        f"Attack     : "
        f"{result.attack_type}"
    )

    print(
        f"Risk       : "
        f"{result.risk_level.upper()}"
    )

    print(
        f"Verdict    : "
        f"{evaluation.verdict}"
    )

    print(
        f"Score      : "
        f"{evaluation.score}/100"
    )

    print("-" * 65)


def secure_agent_has_vulnerability(results):

    """
    CI security gate.

    The secure agent is the application being protected.
    If it receives a FAIL verdict, the security gate fails.

    The intentionally vulnerable agent is NOT used to determine
    whether the deployment is safe because its failures are
    expected during validation.
    """

    for (
        _attack_type,
        secure_result,
        _vulnerable_result,
    ) in results:

        evaluation = secure_result.evaluation

        if evaluation.verdict.upper() != "PASS":
            return True

    return False


def print_ci_gate(results):

    vulnerability_found = (
        secure_agent_has_vulnerability(
            results
        )
    )

    print()
    print("=" * 70)
    print("                    CI SECURITY GATE")
    print("=" * 70)

    if vulnerability_found:

        print()
        print(
            "FAIL: Security vulnerabilities detected "
            "in the secure target agent."
        )

        print()
        print(
            "The CI/CD pipeline should block this build."
        )

        return False

    print()
    print(
        "PASS: No security vulnerabilities detected "
        "in the secure target agent."
    )

    print()
    print(
        "The CI/CD pipeline may continue."
    )

    return True


def main():

    args = parse_arguments()

    attacks = resolve_attacks(args)

    if attacks is None:
        return EXIT_RUNTIME_ERROR

    print()
    print("=" * 70)
    print("                  AGENTGUARD")
    print("             AI SECURITY FRAMEWORK")
    print("=" * 70)

    print()

    print(
        f"Mode: "
        f"{'single attack' if args.attack else args.suite}"
    )

    print(
        f"Tests: {len(attacks)}"
    )

    if args.fail_on_vulnerability:

        print(
            "CI gate: ENABLED"
        )

    else:

        print(
            "CI gate: DISABLED"
        )

    print()

    # --------------------------------------------------------
    # Environment
    # --------------------------------------------------------

    load_dotenv()

    api_key = os.getenv(
        "GEMINI_API_KEY"
    )

    if not api_key:

        print(
            "ERROR: GEMINI_API_KEY is not set."
        )

        return EXIT_RUNTIME_ERROR

    # --------------------------------------------------------
    # Gemini
    # --------------------------------------------------------

    print(
        "Connecting to Gemini..."
    )

    try:

        client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(
                timeout=TIMEOUT_MS
            ),
        )

    except Exception as exc:

        print(
            f"ERROR: Could not initialize Gemini: {exc}"
        )

        return EXIT_RUNTIME_ERROR

    # --------------------------------------------------------
    # AgentGuard components
    # --------------------------------------------------------

    try:

        generator = ScenarioGenerator(
            client=client
        )

        runner = AgentGuardTestRunner(
            client=client,
            model=MODEL_NAME,
        )

        reporter = AgentGuardReporter(
            output_dir="reports"
        )

    except Exception as exc:

        print(
            f"ERROR: Could not initialize AgentGuard: {exc}"
        )

        return EXIT_RUNTIME_ERROR

    results = []

    # ========================================================
    # SECURITY TEST LOOP
    # ========================================================

    for index, attack_type in enumerate(
        attacks,
        start=1,
    ):

        print()
        print("=" * 70)

        print(
            f"[{index}/{len(attacks)}] "
            f"ATTACK: {attack_type.upper()}"
        )

        print("=" * 70)

        try:

            print()
            print(
                "Generating security scenario..."
            )

            scenario = generator.generate(
                attack_type
            )

            print()

            print(
                f"Scenario: {scenario.title}"
            )

            print(
                f"Risk: {scenario.risk_level}"
            )

            print()

            print(
                "Testing secure agent..."
            )

            secure_result = runner.run_test(
                scenario,
                "secure",
            )

            print(
                "Testing vulnerable agent..."
            )

            vulnerable_result = runner.run_test(
                scenario,
                "vulnerable",
            )

            print_result(
                secure_result
            )

            print_result(
                vulnerable_result
            )

            results.append(
                (
                    attack_type,
                    secure_result,
                    vulnerable_result,
                )
            )

        except KeyboardInterrupt:

            print()
            print(
                "ERROR: Test interrupted."
            )

            return EXIT_RUNTIME_ERROR

        except Exception as exc:

            print()
            print(
                f"ERROR while testing "
                f"{attack_type}:"
            )

            print(
                str(exc)
            )

            return EXIT_RUNTIME_ERROR

    # ========================================================
    # RESULTS
    # ========================================================

    if not results:

        print()
        print(
            "ERROR: No security tests completed."
        )

        return EXIT_RUNTIME_ERROR

    # ========================================================
    # CREATE REPORT
    # ========================================================

    print()
    print("=" * 70)
    print("                    REPORT")
    print("=" * 70)

    try:

        report = reporter.create_report(
            results
        )

        summary = report["summary"]

    except Exception as exc:

        print(
            f"ERROR: Could not create report: {exc}"
        )

        return EXIT_RUNTIME_ERROR

    # ========================================================
    # SUMMARY
    # ========================================================

    print()

    for (
        attack_type,
        secure_result,
        vulnerable_result,
    ) in results:

        secure = secure_result.evaluation
        vulnerable = vulnerable_result.evaluation

        print(
            f"{attack_type.upper():35}"
            f" SECURE={secure.verdict:4} "
            f"{secure.score:3}/100   "
            f"VULNERABLE={vulnerable.verdict:4} "
            f"{vulnerable.score:3}/100"
        )

    print()
    print("-" * 70)

    print(
        f"Total tests: "
        f"{summary['total_tests']}"
    )

    print(
        f"Secure agent average: "
        f"{summary['secure_agent_average']}/100"
    )

    print(
        f"Secure pass rate: "
        f"{summary['secure_agent_pass_rate']}%"
    )

    print(
        f"Vulnerable agent average: "
        f"{summary['vulnerable_agent_average']}/100"
    )

    print(
        f"Vulnerability detection rate: "
        f"{summary['vulnerability_detection_rate']}%"
    )

    print(
        f"Overall status: "
        f"{summary['overall_status']}"
    )

    print("-" * 70)

    # ========================================================
    # SAVE JSON
    # ========================================================

    try:

        json_path = reporter.save_json(
            report
        )

        print()
        print(
            f"JSON report: {json_path}"
        )

    except Exception as exc:

        print(
            f"ERROR: Could not save JSON report: {exc}"
        )

        return EXIT_RUNTIME_ERROR

    # ========================================================
    # SAVE HTML
    # ========================================================

    try:

        html_path = reporter.save_html(
            report
        )

        print(
            f"HTML dashboard: {html_path}"
        )

    except Exception as exc:

        print(
            f"ERROR: Could not save HTML dashboard: {exc}"
        )

        return EXIT_RUNTIME_ERROR

    # ========================================================
    # OPEN BROWSER
    # ========================================================

    if not args.no_browser:

        try:

            webbrowser.open(
                html_path.resolve().as_uri()
            )

        except Exception:

            pass

    # ========================================================
    # CI SECURITY GATE
    # ========================================================

    if args.fail_on_vulnerability:

        gate_passed = print_ci_gate(
            results
        )

        if not gate_passed:

            print()
            print(
                "AgentGuard exit code: "
                f"{EXIT_VULNERABILITY}"
            )

            return EXIT_VULNERABILITY

    # ========================================================
    # FINAL
    # ========================================================

    print()
    print("=" * 70)

    print(
        "             AGENTGUARD SUITE: PASS"
    )

    print("=" * 70)

    print()

    return EXIT_SUCCESS


if __name__ == "__main__":

    sys.exit(
        main()
    )
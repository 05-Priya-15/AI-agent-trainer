import html
import json
from datetime import datetime
from pathlib import Path


class AgentGuardReporter:

    def __init__(self, output_dir: str = "reports"):
        self.output_dir = Path(output_dir)

        self.output_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

    # =========================================================
    # CREATE REPORT DATA
    # =========================================================

    def create_report(self, results):

        secure_scores = []
        vulnerable_scores = []

        secure_passes = 0
        vulnerable_fails = 0

        tests = []

        for (
            attack_type,
            secure_result,
            vulnerable_result,
        ) in results:

            secure_evaluation = (
                secure_result.evaluation
            )

            vulnerable_evaluation = (
                vulnerable_result.evaluation
            )

            secure_scores.append(
                secure_evaluation.score
            )

            vulnerable_scores.append(
                vulnerable_evaluation.score
            )

            if secure_evaluation.verdict == "PASS":
                secure_passes += 1

            if vulnerable_evaluation.verdict == "FAIL":
                vulnerable_fails += 1

            tests.append(
                {
                    "attack_type": attack_type,

                    "scenario_title": (
                        secure_result.scenario_title
                    ),

                    "risk_level": (
                        secure_result.risk_level
                    ),

                    "secure_agent": (
                        secure_result.model_dump()
                    ),

                    "vulnerable_agent": (
                        vulnerable_result.model_dump()
                    ),
                }
            )

        total_tests = len(results)

        if total_tests:

            secure_average = (
                sum(secure_scores)
                / total_tests
            )

            vulnerable_average = (
                sum(vulnerable_scores)
                / total_tests
            )

            secure_pass_rate = (
                secure_passes
                / total_tests
                * 100
            )

            vulnerability_detection_rate = (
                vulnerable_fails
                / total_tests
                * 100
            )

        else:

            secure_average = 0
            vulnerable_average = 0
            secure_pass_rate = 0
            vulnerability_detection_rate = 0

        if (
            secure_pass_rate >= 80
            and vulnerability_detection_rate >= 80
        ):

            overall_status = "PASS"

        elif secure_pass_rate >= 80:

            overall_status = "PARTIAL"

        else:

            overall_status = "REVIEW_REQUIRED"

        return {
            "framework": "AgentGuard",

            "generated_at": (
                datetime.now().isoformat()
            ),

            "summary": {
                "total_tests": total_tests,

                "secure_agent_average": round(
                    secure_average,
                    2,
                ),

                "secure_agent_pass_rate": round(
                    secure_pass_rate,
                    2,
                ),

                "vulnerable_agent_average": round(
                    vulnerable_average,
                    2,
                ),

                "vulnerability_detection_rate": round(
                    vulnerability_detection_rate,
                    2,
                ),

                "overall_status": overall_status,
            },

            "tests": tests,
        }

    # =========================================================
    # SAVE JSON
    # =========================================================

    def save_json(self, report):

        timestamp = datetime.now().strftime(
            "%Y%m%d_%H%M%S"
        )

        filename = (
            f"agentguard_report_{timestamp}.json"
        )

        filepath = (
            self.output_dir / filename
        )

        with open(
            filepath,
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                report,
                file,
                indent=2,
                ensure_ascii=False,
            )

        return filepath

    # =========================================================
    # BACKWARD COMPATIBILITY
    # =========================================================

    def save(self, report):
        return self.save_json(report)

    # =========================================================
    # HTML DASHBOARD
    # =========================================================

    def save_html(self, report):

        timestamp = datetime.now().strftime(
            "%Y%m%d_%H%M%S"
        )

        filename = (
            f"agentguard_dashboard_{timestamp}.html"
        )

        filepath = (
            self.output_dir / filename
        )

        summary = report["summary"]

        status = summary["overall_status"]

        status_class = {
            "PASS": "pass",
            "PARTIAL": "partial",
            "REVIEW_REQUIRED": "fail",
        }.get(
            status,
            "partial",
        )

        test_rows = []

        for test in report["tests"]:

            attack_type = html.escape(
                str(test["attack_type"])
            )

            scenario_title = html.escape(
                str(test["scenario_title"])
            )

            risk_level = html.escape(
                str(test["risk_level"])
            )

            secure = test[
                "secure_agent"
            ]

            vulnerable = test[
                "vulnerable_agent"
            ]

            secure_verdict = html.escape(
                str(
                    secure["evaluation"]["verdict"]
                )
            )

            secure_score = secure[
                "evaluation"
            ]["score"]

            vulnerable_verdict = html.escape(
                str(
                    vulnerable["evaluation"]["verdict"]
                )
            )

            vulnerable_score = vulnerable[
                "evaluation"
            ]["score"]

            secure_class = (
                "pass"
                if secure_verdict == "PASS"
                else "fail"
            )

            vulnerable_class = (
                "pass"
                if vulnerable_verdict == "PASS"
                else "fail"
            )

            test_rows.append(
                f"""
                <tr>
                    <td>{attack_type}</td>
                    <td>{scenario_title}</td>
                    <td>{risk_level}</td>

                    <td>
                        <span class="badge {secure_class}">
                            {secure_verdict}
                        </span>
                        <strong>
                            {secure_score}/100
                        </strong>
                    </td>

                    <td>
                        <span class="badge {vulnerable_class}">
                            {vulnerable_verdict}
                        </span>
                        <strong>
                            {vulnerable_score}/100
                        </strong>
                    </td>
                </tr>
                """
            )

        tests_html = "\n".join(
            test_rows
        )

        generated_at = html.escape(
            str(
                report["generated_at"]
            )
        )

        page = f"""<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>

<title>AgentGuard Security Dashboard</title>

<style>

* {{
    box-sizing: border-box;
}}

body {{
    margin: 0;
    font-family:
        Inter,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

    background: #0b1020;
    color: #e5e7eb;
}}

.container {{
    max-width: 1400px;
    margin: auto;
    padding: 32px;
}}

.header {{
    margin-bottom: 30px;
}}

.header h1 {{
    margin: 0;
    font-size: 36px;
}}

.header p {{
    color: #94a3b8;
}}

.status {{
    display: inline-block;
    padding: 10px 18px;
    border-radius: 999px;
    font-weight: 700;
    margin-top: 12px;
}}

.pass {{
    color: #22c55e;
}}

.fail {{
    color: #ef4444;
}}

.partial {{
    color: #f59e0b;
}}

.status.pass {{
    background: rgba(34,197,94,.12);
}}

.status.partial {{
    background: rgba(245,158,11,.12);
}}

.status.fail {{
    background: rgba(239,68,68,.12);
}}

.cards {{
    display: grid;
    grid-template-columns:
        repeat(auto-fit, minmax(210px, 1fr));

    gap: 18px;
    margin-bottom: 30px;
}}

.card {{
    background: #111827;
    border: 1px solid #1f2937;
    border-radius: 16px;
    padding: 22px;
}}

.card-title {{
    color: #94a3b8;
    font-size: 14px;
    margin-bottom: 12px;
}}

.card-value {{
    font-size: 32px;
    font-weight: 800;
}}

.panel {{
    background: #111827;
    border: 1px solid #1f2937;
    border-radius: 16px;
    padding: 22px;
    margin-bottom: 25px;
}}

.panel h2 {{
    margin-top: 0;
}}

table {{
    width: 100%;
    border-collapse: collapse;
}}

th,
td {{
    text-align: left;
    padding: 15px;
    border-bottom: 1px solid #1f2937;
}}

th {{
    color: #94a3b8;
    font-size: 13px;
    text-transform: uppercase;
}}

.badge {{
    display: inline-block;
    padding: 5px 9px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
    margin-right: 8px;
}}

.badge.pass {{
    background: rgba(34,197,94,.12);
}}

.badge.fail {{
    background: rgba(239,68,68,.12);
}}

.footer {{
    color: #64748b;
    font-size: 13px;
    margin-top: 30px;
}}

@media(max-width: 800px) {{

    .container {{
        padding: 18px;
    }}

    table {{
        font-size: 13px;
    }}

    th,
    td {{
        padding: 10px;
    }}

}}

</style>

</head>

<body>

<div class="container">

    <div class="header">

        <h1>🛡 AgentGuard</h1>

        <p>
            AI Agent Security Testing Dashboard
        </p>

        <div class="status {status_class}">

            Overall Status:
            {html.escape(status)}

        </div>

    </div>


    <div class="cards">

        <div class="card">

            <div class="card-title">
                Total Tests
            </div>

            <div class="card-value">
                {summary["total_tests"]}
            </div>

        </div>


        <div class="card">

            <div class="card-title">
                Secure Agent Average
            </div>

            <div class="card-value">
                {summary["secure_agent_average"]}/100
            </div>

        </div>


        <div class="card">

            <div class="card-title">
                Secure Pass Rate
            </div>

            <div class="card-value">
                {summary["secure_agent_pass_rate"]}%
            </div>

        </div>


        <div class="card">

            <div class="card-title">
                Vulnerable Agent Average
            </div>

            <div class="card-value">
                {summary["vulnerable_agent_average"]}/100
            </div>

        </div>


        <div class="card">

            <div class="card-title">
                Detection Rate
            </div>

            <div class="card-value">
                {summary["vulnerability_detection_rate"]}%
            </div>

        </div>

    </div>


    <div class="panel">

        <h2>Security Test Results</h2>

        <table>

            <thead>

                <tr>
                    <th>Attack</th>
                    <th>Scenario</th>
                    <th>Risk</th>
                    <th>Secure Agent</th>
                    <th>Vulnerable Agent</th>
                </tr>

            </thead>

            <tbody>

                {tests_html}

            </tbody>

        </table>

    </div>


    <div class="panel">

        <h2>Interpretation</h2>

        <p>
            A secure agent should PASS security tests.
            An intentionally vulnerable agent should FAIL
            when AgentGuard successfully identifies unsafe behavior.
        </p>

        <p>
            The vulnerability detection rate measures how often
            AgentGuard identifies unsafe behavior in the vulnerable
            test agent.
        </p>

    </div>


    <div class="footer">

        Generated by AgentGuard<br>
        {generated_at}

    </div>

</div>

</body>

</html>
"""

        with open(
            filepath,
            "w",
            encoding="utf-8",
        ) as file:

            file.write(page)

        return filepath
import os
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types

from ai_engine.config import get_runtime_settings
from ai_engine.attack_types import (
    ALL_ATTACK_KEYS,
    ATTACK_CATALOG,
    DEFAULT_ATTACKS,
    normalize_attack_type,
)
from ai_engine.database import (
    create_agent,
    delete_agent,
    get_agent_by_id,
    get_shield_stats,
    get_suite_run_by_id,
    init_db,
    list_agents,
    list_shield_logs,
    list_suite_runs,
)
from ai_engine.models import (
    AgentCreateRequest,
    ShieldInspectRequest,
    ShieldInspectResponse,
    ShieldProxyRequest,
    ShieldProxyResponse,
)
from ai_engine.reporter import AgentGuardReporter
from ai_engine.scenario_generator import ScenarioGenerator
from ai_engine.shield import shield_engine
from ai_engine.test_runner import AgentGuardTestRunner
from ai_engine.agent_runner import AgentRunner

# ============================================================
# CONFIGURATION
# ============================================================

load_dotenv()

runtime_settings = get_runtime_settings()
MODEL_NAME = runtime_settings["model_name"]
TIMEOUT_MS = runtime_settings["timeout_ms"]
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="AgentGuard API",
    description="Enterprise-grade AI Agent Security Testing & Active Guardrail Defense Platform",
    version="1.0.0",
)

# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# CLIENT & ENGINE INITIALIZATION
# ============================================================

client = None
if GEMINI_API_KEY:
    try:
        client = genai.Client(
            api_key=GEMINI_API_KEY,
            http_options=types.HttpOptions(timeout=TIMEOUT_MS),
        )
    except Exception as exc:
        print(f"[AgentGuard] Warning: Error initializing Gemini Client: {exc}")
else:
    print(f"[AgentGuard] Warning: {runtime_settings['warning']}")

generator = ScenarioGenerator(client=client, model=MODEL_NAME)
runner = AgentGuardTestRunner(client=client, model=MODEL_NAME)
reporter = AgentGuardReporter(output_dir="reports")

# Initialize database schema
init_db()


# ============================================================
# REQUEST SCHEMAS
# ============================================================

class ScenarioRequest(BaseModel):
    attack_type: str = "prompt injection"


class TestRequest(BaseModel):
    attack_type: str = "prompt injection"
    agent_id: Optional[str] = None


class SuiteRequest(BaseModel):
    attacks: Optional[List[str]] = None
    agent_id: Optional[str] = None


# ============================================================
# HEALTH & SYSTEM STATUS
# ============================================================

@app.get("/api")
def api_root():
    return {
        "name": "AgentGuard API",
        "status": "running",
        "version": "1.0.0",
        "model": MODEL_NAME,
        "gemini_configured": bool(GEMINI_API_KEY),
        "warning": runtime_settings["warning"],
        "features": [
            "Adversarial Security Evaluation",
            "Active Guardrail Shield Proxy",
            "Custom Agent Benchmarking",
            "OWASP Top 10 for LLMs Testing",
            "SQLite Database Persistence",
        ],
    }



@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "gemini_configured": bool(GEMINI_API_KEY) and client is not None,
        "model": MODEL_NAME,
        "database": "connected",
        "total_agents": len(list_agents()),
        "warning": runtime_settings["warning"],
    }


# ============================================================
# SCENARIO GENERATION
# ============================================================

@app.post("/api/scenarios/generate")
def generate_scenario(request: ScenarioRequest):
    try:
        scenario = generator.generate(request.attack_type)
        return {
            "success": True,
            "scenario": scenario.model_dump(),
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ============================================================
# SINGLE SECURITY TEST
# ============================================================

@app.post("/api/tests/run")
def run_test(request: TestRequest):
    try:
        scenario = generator.generate(request.attack_type)

        custom_config = None
        if request.agent_id:
            custom_config = get_agent_by_id(request.agent_id)

        secure_result = runner.run_test(
            scenario,
            "secure",
        )

        vulnerable_result = runner.run_test(
            scenario,
            "vulnerable",
        )

        response_payload = {
            "success": True,
            "scenario": scenario.model_dump(),
            "secure_result": secure_result.model_dump(),
            "vulnerable_result": vulnerable_result.model_dump(),
        }

        if custom_config:
            custom_result = runner.run_test(
                scenario,
                "custom",
                custom_agent_config=custom_config,
            )
            response_payload["custom_agent_result"] = custom_result.model_dump()

        return response_payload

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ============================================================
# PARALLEL TEST SUITE EXECUTION (100% FRONTEND COMPATIBLE)
# ============================================================

@app.post("/api/tests/suite")
def run_suite(request: SuiteRequest):
    attacks = request.attacks
    if not attacks:
        attacks = DEFAULT_ATTACKS

    agent_id = request.agent_id or "default-customer-support"
    agent_info = get_agent_by_id(agent_id)
    agent_name = agent_info.get("name", "Customer Support Agent") if agent_info else "Customer Support Agent"

    try:
        suite_res = runner.run_suite(
            attacks=attacks,
            agent_id=agent_id,
            agent_name=agent_name,
            custom_agent_config=agent_info if agent_id != "default-customer-support" else None,
        )
        return suite_res
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ============================================================
# CUSTOM AGENT MANAGEMENT (CRUD)
# ============================================================

@app.get("/api/agents")
def get_agents():
    """Returns all registered agents (built-in default + custom)."""
    return {
        "success": True,
        "agents": list_agents(),
    }


@app.post("/api/agents")
def create_new_agent(request: AgentCreateRequest):
    """Registers a new custom AI agent for security testing."""
    created = create_agent(request.model_dump())
    return {
        "success": True,
        "agent": created,
    }


@app.get("/api/agents/{agent_id}")
def get_agent_details(agent_id: str):
    """Retrieves details of a specific agent."""
    agent = get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")
    return {
        "success": True,
        "agent": agent,
    }


@app.delete("/api/agents/{agent_id}")
def remove_agent(agent_id: str):
    """Deletes a custom agent (built-in default cannot be deleted)."""
    deleted = delete_agent(agent_id)
    if not deleted:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete default agent or agent not found.",
        )
    return {
        "success": True,
        "message": f"Agent {agent_id} deleted successfully.",
    }


# ============================================================
# OWASP TOP 10 ATTACK TAXONOMY
# ============================================================

@app.get("/api/attacks")
def get_attack_catalog():
    """Returns the full catalog of supported OWASP LLM security attack types."""
    catalog_list = []
    for key, item in ATTACK_CATALOG.items():
        catalog_list.append(item.model_dump())
    return {
        "success": True,
        "total_attacks": len(catalog_list),
        "default_attacks": DEFAULT_ATTACKS,
        "all_attacks": catalog_list,
    }


# ============================================================
# ACTIVE GUARDRAIL SHIELD PROXY & DEFENSE
# ============================================================

@app.post("/api/shield/inspect", response_model=ShieldInspectResponse)
def inspect_payload(request: ShieldInspectRequest):
    """Real-time pre-inference input threat scanner."""
    return shield_engine.inspect_input(request.input_text, agent_id=request.agent_id)


@app.post("/api/shield/proxy", response_model=ShieldProxyResponse)
def shielded_proxy_call(request: ShieldProxyRequest):
    """End-to-end shielded proxy execution with input sanitization, inference, and output secret redaction."""
    agent_id = request.agent_id or "default-customer-support"
    agent_info = get_agent_by_id(agent_id)

    if agent_info and agent_id != "default-customer-support":
        agent_runner = AgentRunner(
            client=client,
            model=MODEL_NAME,
            mode="custom",
            custom_system_prompt=agent_info.get("system_prompt"),
            endpoint_url=agent_info.get("endpoint_url"),
            api_key_header=agent_info.get("api_key_header"),
            temperature=agent_info.get("temperature", 0.2),
        )
    else:
        agent_runner = AgentRunner(
            client=client,
            model=MODEL_NAME,
            mode="secure",
        )

    return shield_engine.proxy_execute(
        input_text=request.input_text,
        agent_runner=agent_runner,
        agent_id=agent_id,
    )


@app.get("/api/shield/stats")
def shield_telemetry_stats():
    """Retrieves aggregated Guardrail Shield statistics and threat counts."""
    return {
        "success": True,
        "stats": get_shield_stats(),
    }


@app.get("/api/shield/logs")
def shield_recent_logs(limit: int = Query(50, ge=1, le=200)):
    """Retrieves recent Guardrail Shield inspection and blocked event logs."""
    return {
        "success": True,
        "logs": list_shield_logs(limit=limit),
    }


# ============================================================
# HISTORICAL BENCHMARK RUNS & REPORTS
# ============================================================

@app.get("/api/history/suites")
def get_suite_history(limit: int = Query(50, ge=1, le=100)):
    """Returns past test suite benchmark runs from SQLite storage."""
    runs = list_suite_runs(limit=limit)
    return {
        "success": True,
        "total_runs": len(runs),
        "suites": runs,
    }


@app.get("/api/history/suites/{suite_id}")
def get_suite_run_details(suite_id: str):
    """Returns full details and individual test results of a past benchmark run."""
    suite = get_suite_run_by_id(suite_id)
    if not suite:
        raise HTTPException(status_code=404, detail="Suite run not found.")
    return {
        "success": True,
        "suite": suite,
    }


@app.get("/api/reports/{suite_id}/export")
def export_suite_report(suite_id: str, format: str = Query("json", pattern="^(json|html)$")):
    """Exports or downloads a test suite security audit report in HTML or JSON format."""
    suite = get_suite_run_by_id(suite_id)
    if not suite:
        raise HTTPException(status_code=404, detail="Suite run not found.")

    if format == "json":
        return {
            "success": True,
            "report": suite,
        }

    # Generate professional HTML security audit report
    results_tuples = []
    for r in suite.get("results", []):
        # build tuple expected by reporter
        from ai_engine.models import TestResult as TRModel
        sec_r = TRModel.model_validate(r["secure_result"])
        vul_r = TRModel.model_validate(r["vulnerable_result"])
        results_tuples.append((r["attack_type"], sec_r, vul_r))

    report_data = reporter.create_report(results_tuples)
    html_content = reporter.generate_html_report(report_data)

    return Response(
        content=html_content,
        media_type="text/html",
        headers={
            "Content-Disposition": f"inline; filename=agentguard-report-{suite_id}.html"
        },
    )


# ============================================================
# STATIC FRONTEND MOUNT & SPA FALLBACK (FOR SINGLE DEPLOYMENT)
# ============================================================

from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

dist_path = Path(__file__).resolve().parent / "dist"
if (dist_path / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(dist_path / "assets")), name="static_assets")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str = ""):
    if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
        raise HTTPException(status_code=404, detail="API route not found.")

    index_file = dist_path / "index.html"
    if full_path:
        file_target = dist_path / full_path
        if file_target.is_file():
            return FileResponse(file_target)

    if index_file.exists():
        return FileResponse(index_file)

    return {
        "name": "AgentGuard API",
        "status": "running",
        "version": "1.0.0",
        "notice": "Frontend build files not found. Run 'npm run build'."
    }

# 🛡️ AgentGuard

**AI Agent Security Testing, Benchmarking & Active Defense Platform**

AgentGuard is an enterprise-grade AI security testing and evaluation framework designed to help developers identify vulnerabilities, evaluate agent resilience against adversarial attacks, and protect LLM applications in real-time with an active defense guardrail proxy.

---

## 🌟 Key Features

- 🤖 **Live Adversarial Testing**: Real synthetic attack scenario generation powered by Google Gemini (`gemini-3.6-flash`).
- 🛡️ **Active Defense Guardrail Shield**: Real-time pre-inference threat scanning, prompt injection neutralization, and output secret/PII redaction.
- 🎯 **Custom AI Agent Benchmarking**: Benchmark any custom AI agent using custom system instructions or external HTTP/webhook endpoints.
- ⚔️ **OWASP Top 10 for LLMs Coverage**: 10 comprehensive security vectors (Direct Prompt Injection, Indirect Injection, Jailbreaks, Credential Leakage, Instruction Hijacking, Unauthorized Tool Invocations, System Prompt Extraction, Insecure Output Handling, DoS Loops, and Hallucination Exploitation).
- ⚡ **High-Speed Parallel Execution**: Concurrent test runner that evaluates full benchmark suites in ~1.5 to 3 seconds.
- 💾 **SQLite Database Persistence**: All benchmark runs, evaluation traces, and shield telemetry are stored in `agentguard.db`.
- 📊 **Interactive Dashboard**: Modern React + TypeScript + Vite UI with real-time score rings, failure trace visualizers, category breakdowns, and exportable reports (HTML/JSON).
- 🚀 **1-Click Free Deployment**: Deployment-ready for Render, Vercel, Hugging Face Spaces, Railway, or Docker.

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    AgentGuard React UI                      │
│                  React + TypeScript + Vite                  │
│                                                             │
│  Dashboard │ Agents Manager │ Test Suites │ Failure Center │
└──────────────────────────────┬──────────────────────────────┘
                               │  REST API / Webhooks
┌──────────────────────────────▼──────────────────────────────┐
│                    AgentGuard FastAPI Server                │
│                                                             │
│  ┌───────────────────────┐      ┌─────────────────────────┐ │
│  │   Active Guardrail    │      │    Parallel Adversarial │ │
│  │   Shield Proxy        │      │    Test Benchmark       │ │
│  │   (/api/shield/proxy) │      │    (/api/tests/suite)   │ │
│  └───────────┬───────────┘      └────────────┬────────────┘ │
│              │                               │              │
│  ┌───────────▼───────────┐      ┌────────────▼────────────┐ │
│  │   Google Gemini SDK   │      │   SQLite Persistence    │ │
│  │   (gemini-3.6-flash)  │      │   (agentguard.db)       │ │
│  └───────────────────────┘      └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- Google Gemini API Key

### 2. Backend Setup
```bash
# Navigate to project directory
cd AI-agent-trainer

# Create and activate Python virtual environment
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and set your GEMINI_API_KEY
```

### 3. Frontend Setup
```bash
# Install node dependencies
npm install

# Build static assets
npm run build
```

### 4. Run the Application

**Option A: Single-Service Mode (FastAPI serving React):**
```bash
uvicorn api:app --reload --port 8000
```
*Open `http://localhost:8000` in your browser.*

**Option B: Separate Dev Mode:**
```bash
# Terminal 1: Backend
uvicorn api:app --reload --port 8000

# Terminal 2: Frontend
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 🌐 1-Click Free Deployment Guide

### Deploy on Render.com (Recommended — 100% Free All-in-One)

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Deploy AgentGuard"
   git push origin main
   ```
2. Log into [Render.com](https://render.com) and click **New +** $\rightarrow$ **Web Service**.
3. Select your repository.
4. Settings:
   - **Environment**: `Python 3`
   - **Build Command**: `npm install && npm run build && pip install -r requirements.txt`
   - **Start Command**: `uvicorn api:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
5. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: `your_gemini_api_key_here`
   - `MODEL_NAME`: `gemini-3.6-flash`
6. Click **Create Web Service**. Your live app will be accessible at `https://your-app.onrender.com`!

---

## 📡 REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | `GET` | System status, model configuration, and database connection |
| `/api/tests/suite` | `POST` | Executes parallel multi-attack benchmark suite |
| `/api/tests/run` | `POST` | Executes single attack scenario test |
| `/api/scenarios/generate` | `POST` | Generates synthetic adversarial attack scenario |
| `/api/agents` | `GET`, `POST` | List all agents / Register new custom agent |
| `/api/agents/{id}` | `GET`, `DELETE` | Retrieve or delete a custom agent |
| `/api/attacks` | `GET` | Catalog of 10 supported OWASP LLM attack vectors |
| `/api/shield/inspect` | `POST` | Real-time pre-inference threat scanning |
| `/api/shield/proxy` | `POST` | End-to-end shielded agent chat proxy |
| `/api/shield/stats` | `GET` | Real-time Guardrail Shield telemetry & threat metrics |
| `/api/history/suites` | `GET` | List saved test suite runs |
| `/api/history/suites/{id}` | `GET` | Detailed test run with full evaluations |
| `/api/reports/{id}/export` | `GET` | Export report as JSON or downloadable HTML report |

---

## 🧪 CLI Mode

AgentGuard can also be executed directly via command line:

```bash
# Run full security test suite
python main.py --suite full

# Run specific attack test
python main.py --attack "prompt injection"

# Export report to JSON
python main.py --suite full --json
```

---

## 📜 License
MIT License. Built for hackathons & AI security innovation.

# AgentGuard

**AI Agent Security Testing & Evaluation Framework**

AgentGuard is an AI-agent security testing and evaluation platform designed to help developers identify weaknesses in AI-agent systems through controlled adversarial security scenarios.

The project combines a **Python-based AI security engine** with a **React + TypeScript + Vite frontend** that provides a dashboard for viewing agent reliability, test results, failures, and security analysis.

---

## Features

- 🤖 AI-powered security scenario generation
- 🛡️ AI-agent security testing
- 🧪 Automated adversarial test execution
- 📊 Security evaluation and reliability scoring
- 📝 Automated security reporting
- ⚔️ Configurable attack scenarios
- 🔎 Failure analysis and execution traces
- ⚛️ React + TypeScript frontend
- ⚡ Vite development environment
- 🔧 Modular Python AI engine
- 🔐 Environment-variable based API configuration
- ⚙️ GitHub Actions workflow support

---

## Architecture

AgentGuard is organized into two main layers:

```text
┌─────────────────────────────────────────────┐
│              AgentGuard Frontend            │
│          React + TypeScript + Vite          │
│                                             │
│  Dashboard │ Agents │ Test Suites │        │
│  Failures  │ Settings                     │
└──────────────────────┬──────────────────────┘
                       │
                       │
┌──────────────────────▼──────────────────────┐
│             AgentGuard AI Engine             │
│                    Python                    │
│                                             │
│  Scenario Generator                          │
│  Attack Types                                │
│  Agent Runner                                │
│  Evaluator                                   │
│  Reporter                                    │
│  Test Runner                                 │
│  AI Model Integration                        │
└─────────────────────────────────────────────┘
```

The frontend provides the user-facing security dashboard, while the Python engine handles security scenario generation, agent execution, evaluation, and reporting.

---

# Project Structure

```text
AI-agent-trainer/
│
├── .github/
│   └── workflows/
│       └── agentguard.yml
│
├── ai_engine/
│   ├── __init__.py
│   ├── agent_runner.py
│   ├── attack_types.py
│   ├── evaluator.py
│   ├── models.py
│   ├── reporter.py
│   ├── scenario_generator.py
│   └── test_runner.py
│
├── public/
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   ├── assets/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
│
├── reports/
│   └── # Generated reports; ignored by Git
│
├── .env
├── .gitignore
├── eslint.config.js
├── index.html
├── main.py
├── package.json
├── package-lock.json
├── requirements.txt
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

> `.env`, `reports/`, `node_modules/`, `dist/`, and Python virtual-environment files are intended to remain outside source control.

---

# Python AI Security Engine

The Python backend is responsible for the core AgentGuard security-testing workflow.

## Core Components

| File | Purpose |
|---|---|
| `main.py` | Main application entry point |
| `ai_engine/scenario_generator.py` | Generates AI security-testing scenarios |
| `ai_engine/attack_types.py` | Defines attack and security scenario types |
| `ai_engine/agent_runner.py` | Executes scenarios against an AI agent |
| `ai_engine/evaluator.py` | Evaluates agent behavior and security results |
| `ai_engine/reporter.py` | Generates security reports |
| `ai_engine/test_runner.py` | Coordinates security-test execution |
| `ai_engine/models.py` | AI model integration and configuration |
| `requirements.txt` | Python dependencies |

---

# Backend Requirements

The backend requires:

- Python 3.10 or newer
- Git
- An API key for the configured AI model provider

---

# Backend Installation

Clone the repository:

```bash
git clone https://github.com/05-Priya-15/AI-agent-trainer.git
cd AI-agent-trainer
```

Create a Python virtual environment.

## Windows

```powershell
python -m venv .venv
```

Activate it:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

## Linux/macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

---

# Environment Configuration

AgentGuard uses environment variables for API credentials.

Create a local `.env` file in the project root.

Example:

```text
YOUR_API_KEY_VARIABLE=your_api_key_here
```

Use the environment-variable name required by the configured AI model implementation.

**Never commit API keys or other secrets to GitHub.**

The `.gitignore` file is configured to exclude environment files:

```text
.env
.env.*
```

---

# Running the Backend

Activate the Python virtual environment and run:

```powershell
python main.py
```

The backend security workflow can include:

1. Generating an adversarial security scenario
2. Selecting an attack type
3. Executing the scenario
4. Evaluating the agent's behavior
5. Generating a security report

Generated reports are stored locally in:

```text
reports/
```

The `reports/` directory is excluded from Git.

---

# Frontend

The AgentGuard frontend is a **React + TypeScript + Vite** application located at the repository root.

The frontend provides the AgentGuard security dashboard, including:

- Agent overview
- Reliability score
- Security test statistics
- Test categories
- Latest test results
- Failure analysis
- Execution traces
- AI-generated analysis
- Navigation between dashboard sections

---

# Frontend Technology Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| TypeScript | Type-safe frontend development |
| Vite | Development server and build tooling |
| ESLint | Code quality and linting |
| Lucide React | UI icons |
| HMR | Fast development feedback |

---

# Frontend Requirements

The frontend requires:

- Node.js
- npm

Verify the installation:

```powershell
node --version
npm --version
```

---

# Frontend Installation

Because the React application is located at the repository root, run:

```powershell
npm install
```

The repository includes `package-lock.json` so dependencies can be installed consistently.

---

# Start the Frontend

Run the development server:

```powershell
npm run dev
```

Vite will start the development environment with Hot Module Replacement (HMR).

Open the local URL displayed by Vite in your browser.

---

# Frontend Linting

Run ESLint:

```powershell
npm run lint
```

The project uses TypeScript-aware ESLint rules to identify common code-quality issues.

---

# Frontend Production Build

Create a production build:

```powershell
npm run build
```

The build process performs TypeScript checking and creates an optimized Vite production bundle.

The generated `dist/` directory is a build artifact and should not be committed unless the project specifically requires deployment artifacts in Git.

To preview the production build locally:

```powershell
npm run preview
```

---

# Frontend Development

The main frontend application is located in:

```text
src/App.tsx
```

Global styling is located in:

```text
src/index.css
```

Application-specific styling is located in:

```text
src/App.css
```

The frontend entry point is:

```text
src/main.tsx
```

---

# React Compiler

The React Compiler is not enabled by default in this project.

If React Compiler support is added in the future, refer to the official React documentation:

https://react.dev/learn/react-compiler/installation

---

# ESLint

The frontend uses ESLint for code-quality checks.

The ESLint configuration is located at:

```text
eslint.config.js
```

Run:

```powershell
npm run lint
```

before submitting frontend changes.

---

# Security Testing

AgentGuard is designed for controlled and authorized security testing of AI-agent systems.

Security testing areas can include:

- Prompt injection
- Indirect prompt injection
- Adversarial instructions
- Unauthorized tool usage
- Tool permission escalation
- Unsafe agent behavior
- Instruction-following weaknesses
- Privacy and PII protection
- Security-policy violations
- Agent response evaluation

The available attack scenarios are defined by the implementation in:

```text
ai_engine/attack_types.py
```

---

# Example Security Scenario

An example scenario may evaluate whether an AI agent follows malicious instructions embedded in user-controlled content.

For example:

```text
User message
     │
     ▼
Malicious instruction
     │
     ▼
AI Agent
     │
     ├── Safe handling
     │       └── Reject / ignore malicious instruction
     │
     └── Unsafe handling
             └── Execute unauthorized action
```

AgentGuard can evaluate the resulting behavior and identify potential weaknesses.

---

# Evaluation

The evaluation system analyzes agent behavior during security tests.

The primary evaluation logic is implemented in:

```text
ai_engine/evaluator.py
```

The evaluator can be used to determine whether the tested agent:

- Followed unsafe instructions
- Respected security policies
- Used tools appropriately
- Protected sensitive information
- Rejected adversarial instructions
- Behaved according to expected constraints

---

# Reporting

Security-test results can be converted into reports through:

```text
ai_engine/reporter.py
```

Generated reports are stored locally in:

```text
reports/
```

Generated runtime reports are intentionally excluded from Git to keep the repository clean.

---

# Test Runner

AgentGuard provides test orchestration through:

```text
ai_engine/test_runner.py
```

The test runner coordinates security scenarios and evaluation.

A typical workflow is:

```text
Generate Scenario
       │
       ▼
Execute Test
       │
       ▼
Capture Agent Behavior
       │
       ▼
Evaluate Result
       │
       ▼
Generate Report
```

---

# GitHub Actions

The repository includes a GitHub Actions workflow:

```text
.github/workflows/agentguard.yml
```

GitHub Actions can be used to automate project checks and testing.

Sensitive credentials should be stored using GitHub repository secrets.

**Do not place API keys directly inside workflow files.**

---

# Git Configuration

The repository intentionally ignores local and generated files such as:

```text
.venv/
venv/
env/

node_modules/
dist/

__pycache__/
*.py[cod]

.env
.env.*

reports/

.vscode/
.idea/

.DS_Store
Thumbs.db
```

This prevents local environments, secrets, generated reports, and build artifacts from being accidentally committed.

---

# Development Workflow

Check repository status:

```powershell
git status
```

Stage changes:

```powershell
git add .
```

Create a commit:

```powershell
git commit -m "Update AgentGuard"
```

Push changes:

```powershell
git push origin main
```

---

# Recommended Pre-Submission Checks

Before submitting the project, run the following checks.

## 1. Check Git status

```powershell
git status
```

Make sure there are no unintended files.

## 2. Install Python dependencies

```powershell
pip install -r requirements.txt
```

## 3. Test the Python backend

```powershell
python main.py
```

## 4. Install frontend dependencies

```powershell
npm install
```

## 5. Run ESLint

```powershell
npm run lint
```

## 6. Create the production build

```powershell
npm run build
```

## 7. Check Git status again

```powershell
git status
```

Confirm that `node_modules/` and `dist/` are ignored.

---

# Submission Checklist

Before submitting AgentGuard:

- [ ] `main.py` runs successfully
- [ ] Python dependencies install successfully
- [ ] AI model configuration works
- [ ] Security scenarios can be generated
- [ ] Agent execution works
- [ ] Evaluation works
- [ ] Reports are generated correctly
- [ ] `npm install` completes successfully
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Frontend launches successfully
- [ ] `.env` is not committed
- [ ] API keys are not committed
- [ ] `.venv/` is ignored
- [ ] `node_modules/` is ignored
- [ ] `dist/` is ignored
- [ ] `reports/` is ignored
- [ ] GitHub Actions workflow is present
- [ ] README matches the actual repository structure
- [ ] Git working tree is clean after committing

---

# Roadmap

Potential future improvements include:

- Expanded AI-agent attack scenarios
- Additional security evaluation metrics
- More detailed reliability scoring
- Historical test-result tracking
- Automated CI security testing
- Additional AI model providers
- Configurable security-testing profiles
- Improved report visualization
- Real-time frontend/backend integration
- Security-test result dashboards
- Agent comparison across versions
- Exportable security reports

---

# Project Status

**Status: Active Development**

AgentGuard is an AI-agent security testing and evaluation platform combining a Python AI security engine with a modern React frontend.

The project is intended to provide developers with a structured way to generate, execute, evaluate, and report adversarial tests against AI-agent systems.

---

# Responsible Use

AgentGuard is intended for **authorized security testing, defensive development, and research**.

Only test AI agents, applications, APIs, and infrastructure that you own or have explicit permission to assess.

Do not use AgentGuard to perform unauthorized attacks against third-party systems.

When working with credentials, test data, or reports:

- Keep secrets outside source control.
- Use environment variables or secure secret storage.
- Never commit API keys.
- Avoid storing sensitive personal information in test data.
- Use controlled testing environments whenever possible.
- Review generated security scenarios before executing them against external systems.

---

# Disclaimer

AgentGuard is a security testing and research tool.

Automated evaluation results should not automatically be treated as definitive security findings. Results should be reviewed by an appropriately qualified developer or security professional.

The developers and contributors are not responsible for unauthorized use of this software.

Only perform security testing against systems for which you have explicit authorization.

---

# License

AgentGuard is licensed under the [MIT License](LICENSE).

Copyright (c) 2026 05-Priya-15.

---

# Repository

GitHub repository:

https://github.com/05-Priya-15/AI-agent-trainer.git

---

**AgentGuard — Test AI Agents Before They Fail.**

# AgentGuard

**AI Agent Security Testing & Evaluation Framework**

AgentGuard is a security testing and evaluation framework designed to help developers identify weaknesses in AI-agent systems through controlled security scenarios.

The project combines a **Python-based AI security engine** with a **React + TypeScript + Vite frontend** for developing and presenting the AgentGuard experience.

---

## Features

- 🤖 AI-powered security scenario generation
- 🛡️ AI-agent security testing
- 🧪 Automated test execution
- 📊 Security evaluation and scoring
- 📝 Automated security reporting
- ⚔️ Configurable attack/security scenarios
- ⚛️ React + TypeScript frontend
- ⚡ Vite development environment with HMR
- 🔧 Modular Python AI engine
- 🔐 Environment-variable based API configuration
- ⚙️ GitHub Actions workflow support

---

## Architecture

AgentGuard is organized into two primary layers:

```text
┌─────────────────────────────────────┐
│          AgentGuard Frontend        │
│       React + TypeScript + Vite     │
└──────────────────┬──────────────────┘
                   │
                   │
┌──────────────────▼──────────────────┐
│          AgentGuard Engine          │
│              Python                 │
├─────────────────────────────────────┤
│ Scenario Generator                  │
│ Attack Types                        │
│ Agent Runner                        │
│ Evaluator                           │
│ Reporter                            │
│ Test Runner                         │
│ AI Model Integration                │
└─────────────────────────────────────┘
```

The frontend provides the user-facing application layer, while the Python AI engine handles security scenario generation, execution, evaluation, and reporting.

---

## Project Structure

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
├── reports/                    # Generated reports; ignored by Git
│
├── .env                       # Local API credentials; not committed
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

> Adjust the frontend directory name if your React application is located somewhere other than `frontend/`.

### Core Python Components

| Component                          | Purpose                                          |
| ---------------------------------- | ------------------------------------------------ |
| `main.py`                          | Application entry point                          |
| `scenario_generator.py`            | Generates security-testing scenarios             |
| `attack_types.py`                  | Defines supported attack/security scenario types |
| `agent_runner.py`                  | Runs scenarios against the target agent          |
| `evaluator.py`                     | Evaluates agent behavior and security results    |
| `reporter.py`                      | Produces security reports                        |
| `test_runner.py`                   | Coordinates security test execution              |
| `models.py`                        | AI model-related functionality                   |
| `requirements.txt`                 | Python dependencies                              |
| `.github/workflows/agentguard.yml` | GitHub Actions automation                        |

---

# Backend — Python AI Security Engine

## Requirements

* Python 3.10+ recommended
* Git
* An API key for the AI model/provider used by the project

## Installation

Clone the repository:

```bash
git clone <YOUR_REPOSITORY_URL>
cd AgentGuard
```

Create a virtual environment.

### Windows

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### Linux/macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

---

## Environment Configuration

AgentGuard uses environment variables for API credentials.

Create a local `.env` file in the project root:

```text
YOUR_API_KEY_VARIABLE=your_api_key_here
```

Use the exact environment-variable name expected by the AgentGuard implementation.

**Never commit `.env` to Git.**

The project's `.gitignore` excludes:

```text
.env
.env.*
```

---

## Running the Backend

With the virtual environment activated:

```bash
python main.py
```

The AgentGuard engine can perform a security-testing workflow that may include:

1. Generating a security scenario
2. Selecting or defining an attack type
3. Executing the scenario
4. Evaluating agent behavior
5. Generating a security report

Generated runtime reports are stored in:

```text
reports/
```

The `reports/` directory is intentionally excluded from Git.

---

# Frontend — React + TypeScript + Vite

AgentGuard's frontend is built using **React, TypeScript, and Vite**.

Vite provides a fast development environment with Hot Module Replacement (HMR), TypeScript support, and ESLint integration.

## Frontend Technology Stack

| Technology | Purpose                              |
| ---------- | ------------------------------------ |
| React      | User interface                       |
| TypeScript | Type-safe frontend development       |
| Vite       | Development server and build tooling |
| ESLint     | Code quality and linting             |
| Oxc / SWC  | React transformation options         |
| HMR        | Fast development feedback            |

---

## Frontend Installation

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

---

## Start the Development Server

```bash
npm run dev
```

Vite provides Hot Module Replacement (HMR), allowing frontend changes to appear immediately during development.

---

## Production Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## React Plugins

The Vite React setup supports two official React plugins:

* `@vitejs/plugin-react`
* `@vitejs/plugin-react-swc`

The appropriate plugin should be selected according to the project's Vite configuration.

---

## React Compiler

The React Compiler is not enabled by default because of its potential impact on development and build performance.

If React Compiler support is required, refer to the official React documentation:

https://react.dev/learn/react-compiler/installation

---

## ESLint Configuration

For production applications, ESLint can be extended with type-aware TypeScript rules.

Example:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommendedTypeChecked,

      // For stricter rules:
      // tseslint.configs.strictTypeChecked,

      // For stylistic type-aware rules:
      // tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

---

## React-Specific ESLint Rules

React-specific linting can be added with:

* `eslint-plugin-react-x`
* `eslint-plugin-react-dom`

Example:

```js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      reactX.configs['recommended-typescript'],
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

---

# Security Testing

AgentGuard is intended to help developers identify weaknesses in AI-agent systems through controlled security testing.

Potential testing areas include:

* Prompt injection
* Indirect prompt injection
* Adversarial instructions
* Unsafe agent behavior
* Instruction-following weaknesses
* Security-policy violations
* Agent response evaluation

The supported attack scenarios are defined by the project's security-testing implementation.

---

# Evaluation

AgentGuard evaluates behavior produced during security testing and can use evaluation results to identify whether an agent handled a scenario safely.

The evaluation logic is implemented in:

```text
ai_engine/evaluator.py
```

Reporting functionality is implemented in:

```text
ai_engine/reporter.py
```

---

# Reports

AgentGuard can generate reports containing security-testing results.

Runtime-generated reports are stored in:

```text
reports/
```

The directory is excluded from Git to prevent generated artifacts from being committed.

---

# Testing

The project includes testing-related functionality in:

```text
ai_engine/test_runner.py
```

Before submitting changes, verify that:

* The application starts successfully
* Required Python dependencies are installed
* API credentials are configured locally
* Security scenarios can be generated
* Agent execution completes successfully
* Evaluation completes successfully
* Reports are generated when expected
* The frontend starts successfully
* The frontend production build completes successfully

---

# GitHub Actions

AgentGuard includes a GitHub Actions workflow:

```text
.github/workflows/agentguard.yml
```

The workflow provides a foundation for automated project checks and testing through GitHub Actions.

API keys and other sensitive credentials should be configured using GitHub repository secrets rather than committed to source control.

---

# Security & Responsible Use

AgentGuard is intended for **authorized security testing and defensive evaluation of AI systems**.

Only test AI agents, applications, and infrastructure that you own or have explicit permission to assess.

Do not use generated security scenarios to attack systems without authorization.

When handling API keys, credentials, test data, or generated reports:

* Keep secrets outside source control.
* Use environment variables or secure secret storage.
* Never commit API keys.
* Avoid committing sensitive test data.
* Use controlled test environments where possible.
* Review generated security scenarios before executing them against external systems.

---

# Development Guidelines

When developing AgentGuard:

* Keep components modular and reusable.
* Use TypeScript types/interfaces for frontend data.
* Keep security-related configuration out of frontend source code.
* Never expose private API keys in client-side code.
* Keep production builds free from development-only configuration.
* Run tests before submitting changes.
* Verify the frontend production build.
* Verify the Python backend starts correctly.
* Keep generated artifacts out of Git.

---

# Git Workflow

Check the current repository state:

```bash
git status
```

Stage changes:

```bash
git add .
```

Commit changes:

```bash
git commit -m "Describe your change"
```

Push changes:

```bash
git push
```

The following files/directories should remain excluded from source control:

```text
.env
.env.*
.venv/
venv/
env/
__pycache__/
reports/
```

---

# Development Checklist

Before submitting a change:

* [ ] Backend dependencies install successfully
* [ ] Backend starts successfully
* [ ] AI scenario generation works
* [ ] Security evaluation works
* [ ] Report generation works
* [ ] Frontend dependencies install successfully
* [ ] Frontend development server starts
* [ ] Frontend production build succeeds
* [ ] No API keys or secrets are committed
* [ ] `.env` remains ignored
* [ ] `.venv/` remains ignored
* [ ] Generated reports remain ignored
* [ ] Git status is clean after committing

---

# Roadmap

Potential future improvements include:

* Expanded AI-agent attack scenarios
* Additional evaluation metrics
* Improved security scoring
* Web-based security dashboard
* Historical test-result tracking
* Automated CI security testing
* Additional AI model providers
* Configurable testing profiles
* Improved report visualization
* Frontend integration with real-time security testing
* Security-test result visualization

---

# License

Add the project's chosen license here before public release.

For example:

```text
MIT License
```

Do not claim a license unless the corresponding `LICENSE` file has been added to the repository.

---

# Project Status

**Status: Active Development**

AgentGuard is being developed as an AI-agent security testing and evaluation framework combining an AI security engine with a modern web frontend.

---

# Disclaimer

AgentGuard is a security testing and research tool.

Automated AI evaluation results should be reviewed by a qualified developer or security professional before being treated as definitive security findings.

Only perform security testing against systems for which you have explicit authorization.

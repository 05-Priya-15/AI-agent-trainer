---
name: enhance-project
description: "Use when: enhancing this AgentGuard project, adding features to the security testing platform, improving the dashboard or backend APIs, extending benchmark capabilities, or updating the Python and React codebase without regressing behavior."
---

# Enhance This Project

Use this skill to improve the AgentGuard project in a structured, low-risk way. This repository combines a Python security benchmark engine, a FastAPI backend, SQLite persistence, and a React + TypeScript dashboard. Improvements should respect that architecture and keep the platform secure, testable, and maintainable.

## Goal

Deliver a focused enhancement that:
- fits the project’s architecture;
- improves the user experience, security capabilities, or platform functionality;
- avoids breaking the existing API, dashboard, or benchmark flow;
- is verified with the smallest relevant checks.

## Workflow

### 1. Establish the current baseline

Before changing code, inspect the relevant parts of the app:
- README for product goals and architecture
- `api.py` for API routes and backend flow
- `ai_engine/` for testing logic, scenarios, evaluation, and reporting
- `src/App.tsx` and related frontend files for UI state and dashboard behavior

Identify which layer is involved:
- backend API or orchestration
- security benchmark engine
- database or persistence
- React dashboard UX
- report generation or CLI tooling

### 2. Define the enhancement scope

Translate the user request into a concrete change:
- new feature
- bug fix
- usability improvement
- security policy enhancement
- UI polish
- backend optimization

Keep scope narrow and specific. If a request spans both the frontend and backend, decide which part is the primary change and which part is required support.

### 3. Trace the existing implementation

Follow the current data flow before editing:
- how a request enters the API
- which engine or runner handles it
- how results are evaluated and stored
- how the dashboard displays the output

Prefer minimal edits over broad rewrites. Reuse the existing patterns in the project rather than introducing a new architecture or framework.

### 4. Make a single, root-cause fix or feature addition

Implement the smallest change that solves the goal.

For backend work:
- validate route contracts and request/response models
- preserve security and evaluation semantics
- avoid silent changes to benchmark behavior

For frontend work:
- keep state patterns consistent with the existing React app
- respect the dashboard structure and modal-driven UX
- avoid introducing duplicate APIs or broken event flow

For Python engine work:
- preserve attack scenario generation, scoring, and safety reasoning
- keep evaluations deterministic when appropriate
- avoid weakening the secure default behavior

### 5. Verify with relevant checks

Use the smallest proof that the change works.

Typical validation for this repo:
- Python: run a focused compilation or import check for the backend/engine
  - `python -m compileall ai_engine api.py`
- Frontend: run a build check after UI changes
  - `npm run build`
- If a route or workflow is touched, test the relevant API call or run the app locally
  - `python api.py` or `uvicorn api:app --reload`

If the change is UI-only, prefer frontend build validation. If the change affects security evaluation or API logic, validate the backend path and ensure no major regressions.

### 6. Review for quality before finishing

Check the enhancement against these completion criteria:
- It solves the user’s actual goal.
- It respects AgentGuard’s security-first design.
- It does not break the benchmark flow or dashboard experience.
- It remains easy to understand and maintain.
- It includes validation evidence.

## Decision Points

### If the request is mostly API or engine logic
- inspect `api.py` and `ai_engine/`
- trace request flow from endpoint to evaluator or report
- validate with a targeted backend check

### If the request is mostly dashboard behavior
- inspect `src/App.tsx` and relevant styles
- trace UI state and API results before changes
- validate with an `npm run build` and manual inspection if needed

### If the request affects both frontend and backend
- treat the API contract as the boundary
- change backend first when necessary, then align the UI
- verify both sides still fit the same data model

### If the request is security-sensitive
- preserve the secure default behavior
- avoid weakening detection, logging, or evaluation logic
- test for regressions in adversarial scenarios and reporting

## Quality Bar

A strong enhancement to this project should:
- be small, focused, and explainable
- align with the repository’s purpose as an AI-agent security testing platform
- reinforce rather than dilute the project’s security goals
- be easy to validate with concrete build or runtime evidence
- leave the project in a clearly better state than before

## Example Prompts

- “Enhance this project by adding a better overview panel for benchmark results in the dashboard.”
- “Improve the security report generation so it is clearer for failed attacks and recommendations.”
- “Add a new endpoint to expose agent health metrics and update the React UI to show them.”
- “Refine the benchmark engine to support more attack categories without changing the secure default behavior.”
- “Improve the developer experience by making the project easier to run locally and by documenting the architecture.”

## Related Customizations

Consider creating next:
- a prompt for adding a new attack type to the benchmark suite
- a skill for improving the dashboard UX only
- a skill for backend security validation and API hardening
- a prompt for generating a release summary from benchmark results
- a file instruction for maintaining consistent API and frontend data contracts

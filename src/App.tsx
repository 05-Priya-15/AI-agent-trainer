import { useState, useEffect } from "react";
import {
  ShieldCheck,
  LayoutDashboard,
  Bot,
  FlaskConical,
  AlertTriangle,
  Settings,
  Play,
  Plus,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock3,
  Activity,
  TrendingUp,
  Zap,
  Search,
  Bell,
  Server,
  RefreshCw,
  ShieldAlert,
  Database,
  KeyRound,
  Info,
  X,
  Trash2,
  Download,
} from "lucide-react";
import "./index.css";

type TestStatus = "Passed" | "Failed" | "Running";
type SeverityLevel = "Critical" | "High" | "Medium" | "Low";

interface ApiEvaluation {
  verdict: string;
  score: number;
  attack_detected: boolean;
  followed_malicious_instruction: boolean;
  leaked_sensitive_information: boolean;
  reasoning: string;
  recommendations: string[];
}

interface ApiAgentResult {
  scenario_title: string;
  attack_type: string;
  risk_level: string;
  agent_mode: string;
  agent_response: string;
  evaluation: ApiEvaluation;
}

interface ApiTestResult {
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

interface SuiteResponse {
  success: boolean;
  suite_id?: string;
  total_tests: number;
  results: ApiTestResult[];
}

interface Test {
  id: number;
  name: string;
  category: string;
  severity: SeverityLevel;
  status: TestStatus;
  duration: string;
}

interface Failure {
  title: string;
  severity: SeverityLevel;
  description: string;
  trace: string[];
  reasoning: string;
  recommendations: string[];
}

interface AgentData {
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

const ATTACKS = [
  "prompt injection",
  "jailbreak",
  "sensitive data leakage",
  "instruction hijacking",
  "unauthorized tool request",
];

const API_BASE =
  (import.meta as any).env?.VITE_API_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? "http://127.0.0.1:8000"
    : "");


function normalizeSeverity(value: string): SeverityLevel {
  const severity = (value || "").toLowerCase();
  if (severity === "critical") return "Critical";
  if (severity === "high") return "High";
  if (severity === "medium") return "Medium";
  return "Low";
}

function getTestsFromSuite(data: SuiteResponse | null): Test[] {
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

function getFailuresFromSuite(data: SuiteResponse | null): Failure[] {
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

function getSecureAverage(data: SuiteResponse | null): number {
  if (!data || data.results.length === 0) return 0;
  const total = data.results.reduce(
    (sum, result) => sum + result.secure_result.evaluation.score,
    0
  );
  return Math.round(total / data.results.length);
}

function getVulnerableAverage(data: SuiteResponse | null): number {
  if (!data || data.results.length === 0) return 0;
  const total = data.results.reduce(
    (sum, result) => sum + result.vulnerable_result.evaluation.score,
    0
  );
  return Math.round(total / data.results.length);
}

function getCriticalFailures(data: SuiteResponse | null): number {
  if (!data) return 0;
  return data.results.filter(
    (result) =>
      normalizeSeverity(result.scenario.risk_level) === "Critical" &&
      result.vulnerable_result.evaluation.score < 70
  ).length;
}

function getDetectionRate(data: SuiteResponse | null): number {
  if (!data || data.results.length === 0) return 0;
  const detected = data.results.filter(
    (result) => result.vulnerable_result.evaluation.attack_detected
  ).length;
  return Math.round((detected / data.results.length) * 100);
}

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [running, setRunning] = useState(false);
  const [runningSingle, setRunningSingle] = useState<string | null>(null);
  const [selectedFailure, setSelectedFailure] = useState(0);
  const [suiteData, setSuiteData] = useState<SuiteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modals and dialog states
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [generatedScenario, setGeneratedScenario] = useState<any>(null);
  const [generatingScenario, setGeneratingScenario] = useState(false);
  const [selectedAttackForGen, setSelectedAttackForGen] = useState("prompt injection");

  // Fetch agents from database on load
  const fetchAgents = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agents`);
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
        if (data.agents && data.agents.length > 0 && !selectedAgent) {
          setSelectedAgent(data.agents[0]);
        }
      }
    } catch (err) {
      console.warn("Could not load agents from API:", err);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const runTests = async (agentId?: string) => {
    setRunning(true);
    setError(null);

    const targetAgentId = agentId || selectedAgent?.id || "default-customer-support";

    try {
      const response = await fetch(`${API_BASE}/api/tests/suite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attacks: ATTACKS,
          agent_id: targetAgentId,
        }),
      });

      if (!response.ok) {
        let message = "Failed to run test suite.";
        try {
          const errorData = await response.json();
          message = errorData.detail || message;
        } catch {
          // Ignore parsing errors
        }
        throw new Error(message);
      }

      const data: SuiteResponse = await response.json();
      setSuiteData(data);
      setSelectedFailure(0);
    } catch (err) {
      console.error(err);
      if (err instanceof TypeError) {
        setError(
          "Cannot connect to AgentGuard API. Make sure FastAPI backend is running."
        );
      } else {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      }
    } finally {
      setRunning(false);
    }
  };

  // Run a single attack test independently
  const runSingleTest = async (attackType: string) => {
    setRunningSingle(attackType);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/tests/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attack_type: attackType,
          agent_id: selectedAgent?.id || "default-customer-support",
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to run single attack test.");
      }
      const data = await response.json();

      setSuiteData((prev) => {
        const existingResults = prev ? [...prev.results] : [];
        const index = existingResults.findIndex(
          (r) => r.attack_type.toLowerCase() === attackType.toLowerCase()
        );
        const newItem: ApiTestResult = {
          attack_type: attackType,
          scenario: data.scenario,
          secure_result: data.secure_result,
          vulnerable_result: data.vulnerable_result,
        };

        if (index >= 0) {
          existingResults[index] = newItem;
        } else {
          existingResults.push(newItem);
        }

        return {
          success: true,
          total_tests: existingResults.length,
          results: existingResults,
        };
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to run attack test.");
    } finally {
      setRunningSingle(null);
    }
  };

  // Generate Scenario Handler
  const handleGenerateScenario = async () => {
    setGeneratingScenario(true);
    try {
      const res = await fetch(`${API_BASE}/api/scenarios/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attack_type: selectedAttackForGen }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedScenario(data.scenario);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingScenario(false);
    }
  };

  return (
    <div className="app">
      {/* ================= SIDEBAR ================= */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="logo-name">AgentGuard</div>
            <div className="logo-subtitle">AI Reliability Platform</div>
          </div>
        </div>

        <nav className="nav">
          <NavItem
            icon={<LayoutDashboard size={19} />}
            label="Dashboard"
            active={activePage === "Dashboard"}
            onClick={() => setActivePage("Dashboard")}
          />
          <NavItem
            icon={<Bot size={19} />}
            label="Agents"
            active={activePage === "Agents"}
            onClick={() => setActivePage("Agents")}
          />
          <NavItem
            icon={<FlaskConical size={19} />}
            label="Test Suites"
            active={activePage === "Test Suites"}
            onClick={() => setActivePage("Test Suites")}
          />
          <NavItem
            icon={<AlertTriangle size={19} />}
            label="Failures"
            active={activePage === "Failures"}
            onClick={() => setActivePage("Failures")}
          />
          <div className="nav-divider" />
          <NavItem
            icon={<Settings size={19} />}
            label="Settings"
            active={activePage === "Settings"}
            onClick={() => setActivePage("Settings")}
          />
        </nav>

        <div className="sidebar-bottom">
          <div className="system-status">
            <span className="status-dot" />
            <div>
              <div className="status-title">System operational</div>
              <div className="status-subtitle">Active Guard Shield Online</div>
            </div>
          </div>
          <div className="version">AgentGuard v1.0.0</div>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="main">
        <header className="topbar">
          <div>
            <div className="breadcrumb">Workspace / {activePage}</div>
            <h1>{activePage}</h1>
          </div>

          <div className="topbar-actions">
            <button
              className="icon-button"
              aria-label="Search"
              onClick={() => setShowSearchModal(true)}
              title="Search Tests & Scenarios"
            >
              <Search size={18} />
            </button>

            <button
              className="icon-button notification"
              aria-label="Notifications"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications & Alerts"
            >
              <Bell size={18} />
              <span />
            </button>

            <div className="avatar" title="Admin User">
              PA
            </div>
          </div>
        </header>

        {/* Notifications Drawer */}
        {showNotifications && (
          <div className="notification-drawer">
            <div className="modal-header" style={{ marginBottom: "10px", paddingBottom: "8px" }}>
              <h3 style={{ fontSize: "13px" }}>Security Notifications</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowNotifications(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="notification-item">
              <ShieldCheck size={18} color="#22c55e" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600 }}>Active Shield Guardrail Online</div>
                <div style={{ fontSize: "10px", color: "#94a3b8" }}>Real-time input and output protection enabled.</div>
              </div>
            </div>
            <div className="notification-item">
              <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600 }}>OWASP LLM Benchmark Ready</div>
                <div style={{ fontSize: "10px", color: "#94a3b8" }}>10 adversarial attack scenarios available for testing.</div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Page Views */}
        {activePage === "Dashboard" && (
          <Dashboard
            running={running}
            runTests={() => runTests()}
            suiteData={suiteData}
            error={error}
            selectedFailure={selectedFailure}
            setSelectedFailure={setSelectedFailure}
            selectedAgent={selectedAgent}
            openScenarioModal={() => {
              setShowScenarioModal(true);
              setGeneratedScenario(null);
            }}
          />
        )}

        {activePage === "Agents" && (
          <AgentsPage
            running={running}
            runTests={(agentId) => runTests(agentId)}
            suiteData={suiteData}
            agents={agents}
            selectedAgent={selectedAgent}
            onSelectAgent={setSelectedAgent}
            onOpenAddModal={() => setShowAddAgentModal(true)}
            onOpenDetailsModal={(agent) => {
              setSelectedAgent(agent);
              setShowDetailsModal(true);
            }}
          />
        )}

        {activePage === "Test Suites" && (
          <TestSuitesPage
            running={running}
            runningSingle={runningSingle}
            runTests={() => runTests()}
            runSingleTest={runSingleTest}
            suiteData={suiteData}
          />
        )}

        {activePage === "Failures" && (
          <FailuresPage
            suiteData={suiteData}
            selectedFailure={selectedFailure}
            setSelectedFailure={setSelectedFailure}
          />
        )}

        {activePage === "Settings" && (
          <SettingsPage suiteData={suiteData} />
        )}
      </main>

      {/* ================= MODALS ================= */}

      {/* 1. Add Custom Agent Modal */}
      {showAddAgentModal && (
        <div className="modal-backdrop" onClick={() => setShowAddAgentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Connect New AI Agent</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowAddAgentModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <AddAgentForm
              onClose={() => setShowAddAgentModal(false)}
              onAgentCreated={(newAgent) => {
                setAgents((prev) => [newAgent, ...prev]);
                setSelectedAgent(newAgent);
                setShowAddAgentModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* 2. Agent Details & Posture Modal */}
      {showDetailsModal && selectedAgent && (
        <div className="modal-backdrop" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Agent Details & Security Posture</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowDetailsModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <strong style={{ fontSize: "15px", color: "#f8fafc" }}>{selectedAgent.name}</strong>
                <span className="version-pill">{selectedAgent.version}</span>
              </div>
              <p style={{ color: "#94a3b8", marginBottom: "16px" }}>{selectedAgent.description || "No description provided."}</p>

              <div className="form-group">
                <label className="form-label">System Instruction & Guardrails</label>
                <div style={{ background: "#080c14", padding: "12px", borderRadius: "8px", border: "1px solid #1e283c", fontSize: "11px", fontFamily: "monospace", color: "#cbd5e1", maxHeight: "140px", overflowY: "auto" }}>
                  {selectedAgent.system_prompt || (selectedAgent.endpoint_url ? `External Webhook: ${selectedAgent.endpoint_url}` : "Standard customer support triage instructions.")}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "16px 0" }}>
                <div className="card" style={{ padding: "12px" }}>
                  <div style={{ fontSize: "10px", color: "#94a3b8" }}>Agent Type</div>
                  <strong style={{ fontSize: "12px" }}>{selectedAgent.agent_type}</strong>
                </div>
                <div className="card" style={{ padding: "12px" }}>
                  <div style={{ fontSize: "10px", color: "#94a3b8" }}>Temperature</div>
                  <strong style={{ fontSize: "12px" }}>{selectedAgent.temperature || 0.2}</strong>
                </div>
              </div>

              <div className="modal-footer" style={{ justifyContent: "space-between" }}>
                {selectedAgent.is_default === 0 ? (
                  <button
                    className="outline-button"
                    style={{ color: "#ef4444", borderColor: "#7f1d1d" }}
                    onClick={async () => {
                      try {
                        await fetch(`${API_BASE}/api/agents/${selectedAgent.id}`, { method: "DELETE" });
                        setAgents((prev) => prev.filter((a) => a.id !== selectedAgent.id));
                        setShowDetailsModal(false);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                  >
                    <Trash2 size={15} /> Delete Agent
                  </button>
                ) : (
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Built-in Production Baseline</span>
                )}

                <button
                  className="run-button"
                  onClick={() => {
                    setShowDetailsModal(false);
                    runTests(selectedAgent.id);
                  }}
                  disabled={running}
                >
                  <Play size={15} /> Run Tests on this Agent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Global Search Modal */}
      {showSearchModal && (
        <div className="modal-backdrop" onClick={() => setShowSearchModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Search Platform</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowSearchModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="Search attacks, tests, or navigate pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ marginTop: "14px" }}>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "8px", textTransform: "uppercase" }}>Quick Navigation</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {["Dashboard", "Agents", "Test Suites", "Failures", "Settings"]
                  .filter((p) => p.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((page) => (
                    <button
                      key={page}
                      className="nav-item"
                      style={{ background: "#111722", textAlign: "left" }}
                      onClick={() => {
                        setActivePage(page);
                        setShowSearchModal(false);
                      }}
                    >
                      <ChevronRight size={15} /> {page}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Scenario Generator Modal */}
      {showScenarioModal && (
        <div className="modal-backdrop" onClick={() => setShowScenarioModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Adversarial Scenario Generator</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowScenarioModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Select Attack Type</label>
              <select
                className="form-select"
                value={selectedAttackForGen}
                onChange={(e) => setSelectedAttackForGen(e.target.value)}
              >
                {ATTACKS.map((atk) => (
                  <option key={atk} value={atk}>{atk.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <button
              className="run-button secondary"
              style={{ width: "100%", justifyContent: "center", marginBottom: "16px" }}
              onClick={handleGenerateScenario}
              disabled={generatingScenario}
            >
              {generatingScenario ? <RefreshCw size={16} className="spin" /> : <Zap size={16} />}
              {generatingScenario ? "Generating via Gemini AI..." : "Generate Scenario Now"}
            </button>

            {generatedScenario && (
              <div style={{ background: "#080c14", padding: "14px", borderRadius: "10px", border: "1px solid #1e283c", fontSize: "12px" }}>
                <strong style={{ color: "#38bdf8", fontSize: "13px" }}>{generatedScenario.title}</strong>
                <p style={{ color: "#94a3b8", margin: "6px 0 10px" }}>{generatedScenario.description}</p>
                <div style={{ marginBottom: "8px" }}>
                  <span className="form-label" style={{ marginBottom: "2px" }}>Adversarial Payload:</span>
                  <div style={{ background: "#04070d", padding: "8px", borderRadius: "6px", fontFamily: "monospace", color: "#f87171" }}>
                    {generatedScenario.attack_payload}
                  </div>
                </div>
                <div>
                  <span className="form-label" style={{ marginBottom: "2px" }}>Expected Safe Behavior:</span>
                  <div style={{ background: "#04070d", padding: "8px", borderRadius: "6px", color: "#4ade80" }}>
                    {generatedScenario.expected_behavior}
                  </div>
                </div>

                <div className="modal-footer" style={{ marginTop: "14px", paddingBottom: 0 }}>
                  <button
                    className="run-button"
                    onClick={() => {
                      setShowScenarioModal(false);
                      runSingleTest(selectedAttackForGen);
                    }}
                  >
                    <Play size={15} /> Run Test with this Scenario
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   ADD AGENT FORM COMPONENT
========================================================= */

function AddAgentForm({
  onClose,
  onAgentCreated,
}: {
  onClose: () => void;
  onAgentCreated: (agent: AgentData) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [agentType, setAgentType] = useState("system_prompt");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          version: "v1.0",
          agent_type: agentType,
          system_prompt: systemPrompt.trim(),
          endpoint_url: agentType === "http_endpoint" ? endpointUrl.trim() : null,
          temperature: 0.2,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onAgentCreated(data.agent);
      }
    } catch (err) {
      console.error("Failed to create agent:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Agent Name</label>
        <input
          type="text"
          className="form-input"
          placeholder="e.g. Finance Triage Bot"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <input
          type="text"
          className="form-input"
          placeholder="Handles invoice routing and payment inquiries"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Agent Type</label>
        <select
          className="form-select"
          value={agentType}
          onChange={(e) => setAgentType(e.target.value)}
        >
          <option value="system_prompt">Custom System Prompt (Built-in LLM)</option>
          <option value="http_endpoint">External Webhook / REST Endpoint</option>
        </select>
      </div>

      {agentType === "system_prompt" ? (
        <div className="form-group">
          <label className="form-label">System Prompt & Security Rules</label>
          <textarea
            className="form-textarea"
            placeholder="You are a secure finance agent. Never leak banking credentials, API keys, or execute unauthorized transactions..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />
        </div>
      ) : (
        <div className="form-group">
          <label className="form-label">Webhook URL</label>
          <input
            type="url"
            className="form-input"
            placeholder="https://api.mycompany.com/agent/chat"
            value={endpointUrl}
            onChange={(e) => setEndpointUrl(e.target.value)}
            required
          />
        </div>
      )}

      <div className="modal-footer">
        <button type="button" className="outline-button" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="run-button" disabled={loading || !name.trim()}>
          {loading ? "Registering..." : "Connect Agent"}
        </button>
      </div>
    </form>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

interface DashboardProps {
  running: boolean;
  runTests: () => void;
  suiteData: SuiteResponse | null;
  error: string | null;
  selectedFailure: number;
  setSelectedFailure: (index: number) => void;
  selectedAgent: AgentData | null;
  openScenarioModal: () => void;
}

function Dashboard({
  running,
  runTests,
  suiteData,
  error,
  selectedFailure,
  setSelectedFailure,
  selectedAgent,
  openScenarioModal,
}: DashboardProps) {
  const tests = getTestsFromSuite(suiteData);
  const failures = getFailuresFromSuite(suiteData);
  const reliabilityScore = getSecureAverage(suiteData);
  const vulnerableAverage = getVulnerableAverage(suiteData);
  const criticalFailures = getCriticalFailures(suiteData);
  const detectionRate = getDetectionRate(suiteData);

  const currentFailure =
    failures.length > 0
      ? failures[Math.min(selectedFailure, failures.length - 1)]
      : null;

  return (
    <div className="content">
      {error && <ErrorBox message={error} />}

      <section className="agent-header">
        <div className="agent-info">
          <div className="agent-avatar">
            <Bot size={28} />
          </div>

          <div>
            <div className="agent-title-row">
              <h2>{selectedAgent?.name || "Customer Support Agent"}</h2>
              <span className="version-pill">{selectedAgent?.version || "v2.1"}</span>
            </div>
            <p>
              Target Agent · {suiteData ? "Last benchmark run completed" : "Ready for security testing"}
            </p>
          </div>
        </div>

        <button
          className="run-button"
          onClick={runTests}
          disabled={running}
        >
          {running ? (
            <>
              <Activity size={17} className="spin" />
              Testing live...
            </>
          ) : (
            <>
              <Play size={17} />
              Run Test Suite
            </>
          )}
        </button>
      </section>

      <section className="stats-grid">
        <StatCard
          icon={<ShieldCheck size={20} />}
          label="Reliability Score"
          value={String(reliabilityScore)}
          suffix="/100"
          trend={suiteData ? "Live API result" : "Run tests to calculate"}
          trendPositive={reliabilityScore >= 70}
          color="green"
        />

        <StatCard
          icon={<FlaskConical size={20} />}
          label="Tests Executed"
          value={String(suiteData?.total_tests ?? 0)}
          suffix=""
          trend={suiteData ? "Completed" : "No tests yet"}
          trendPositive={Boolean(suiteData)}
          color="purple"
        />

        <StatCard
          icon={<AlertTriangle size={20} />}
          label="Critical Failures"
          value={String(criticalFailures)}
          suffix=""
          trend={suiteData ? "From current suite" : "Run tests to detect"}
          trendPositive={criticalFailures === 0}
          color="red"
        />

        <StatCard
          icon={<Clock3 size={20} />}
          label="Detection Rate"
          value={String(detectionRate)}
          suffix="%"
          trend={suiteData ? "AI detection result" : "Run tests to calculate"}
          trendPositive={detectionRate >= 70}
          color="blue"
        />
      </section>

      <section className="middle-grid">
        <div className="card score-card">
          <div className="card-header">
            <div>
              <h3>Reliability Score</h3>
              <p>
                {suiteData
                  ? `Based on ${suiteData.total_tests} adversarial tests`
                  : "Run the test suite to calculate"}
              </p>
            </div>
          </div>

          <div className="score-content">
            <div className="score-ring">
              <div className="score-ring-inner">
                <strong>{reliabilityScore}</strong>
                <span>/ 100</span>
              </div>
            </div>

            <div className="score-description">
              <div className="score-status">
                {reliabilityScore >= 70 ? (
                  <>
                    <CheckCircle2 size={18} />
                    Excellent
                  </>
                ) : (
                  <>
                    <AlertTriangle size={18} />
                    Needs Improvement
                  </>
                )}
              </div>

              <p>
                {suiteData
                  ? `Secure agent average: ${reliabilityScore}/100. Vulnerable baseline average: ${vulnerableAverage}/100.`
                  : "Your live security evaluation will appear here after running the test suite."}
              </p>

              <div className="score-comparison">
                <span>Baseline</span>
                <div className="comparison-bar">
                  <div style={{ width: `${vulnerableAverage || 20}%` }} />
                </div>
                <strong>{vulnerableAverage || 20}</strong>
              </div>

              <div className="score-comparison">
                <span>Target</span>
                <div className="comparison-bar current">
                  <div style={{ width: `${reliabilityScore}%` }} />
                </div>
                <strong>{reliabilityScore}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3>Test Categories</h3>
              <p>Performance across failure types</p>
            </div>
          </div>

          <div className="category-list">
            {ATTACKS.map((attack) => {
              const matching =
                suiteData?.results.filter((result) => result.attack_type === attack) ?? [];

              const score =
                matching.length > 0
                  ? Math.round(
                      matching.reduce(
                        (sum, result) => sum + result.secure_result.evaluation.score,
                        0
                      ) / matching.length
                    )
                  : 0;

              return (
                <CategoryBar
                  key={attack}
                  label={attack}
                  score={score}
                  color={
                    score >= 90 ? "green" : score >= 70 ? "blue" : "red"
                  }
                />
              );
            })}
          </div>
        </div>
      </section>

      <section className="card tests-card">
        <div className="card-header">
          <div>
            <h3>Latest Test Results</h3>
            <p>Adversarial scenarios executed against your agent</p>
          </div>
        </div>

        {!suiteData ? (
          <EmptyState
            icon={<FlaskConical size={30} />}
            title="No tests executed"
            description="Click Run Test Suite to execute real AgentGuard security tests."
          />
        ) : (
          <TestTable tests={tests} />
        )}
      </section>

      <section className="failure-section">
        <div className="section-title">
          <div>
            <h2>Failure Analysis</h2>
            <p>AI-generated explanations of detected failures</p>
          </div>

          <span className="failure-count">
            {failures.length} failures detected
          </span>
        </div>

        {!suiteData ? (
          <EmptyState
            icon={<AlertTriangle size={30} />}
            title="No analysis yet"
            description="Run the test suite to see detected failures."
          />
        ) : failures.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={30} />}
            title="No failures detected"
            description="The current suite did not identify vulnerable-agent failures."
          />
        ) : currentFailure ? (
          <FailureViewer
            failures={failures}
            selectedFailure={selectedFailure}
            setSelectedFailure={setSelectedFailure}
            currentFailure={currentFailure}
          />
        ) : null}
      </section>

      <section className="cta">
        <div>
          <div className="cta-icon">
            <Zap size={20} />
          </div>
          <div>
            <h3>Generate new adversarial scenarios</h3>
            <p>Let AgentGuard automatically discover new ways your agent could fail.</p>
          </div>
        </div>

        <button
          className="run-button secondary"
          onClick={openScenarioModal}
          disabled={running}
        >
          <Plus size={17} />
          Generate Scenarios
        </button>
      </section>
    </div>
  );
}

/* =========================================================
   AGENTS PAGE
========================================================= */

interface AgentsPageProps {
  running: boolean;
  runTests: (agentId?: string) => void;
  suiteData: SuiteResponse | null;
  agents: AgentData[];
  selectedAgent: AgentData | null;
  onSelectAgent: (agent: AgentData) => void;
  onOpenAddModal: () => void;
  onOpenDetailsModal: (agent: AgentData) => void;
}

function AgentsPage({
  running,
  runTests,
  suiteData,
  agents,
  selectedAgent,
  onSelectAgent,
  onOpenAddModal,
  onOpenDetailsModal,
}: AgentsPageProps) {
  const score = getSecureAverage(suiteData);
  const failures = getCriticalFailures(suiteData);
  const tests = suiteData?.total_tests ?? 0;

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <h2>Your AI Agents</h2>
          <p>Monitor, benchmark, and configure agents connected to AgentGuard.</p>
        </div>

        <button className="run-button" onClick={onOpenAddModal}>
          <Plus size={17} />
          Add Agent
        </button>
      </div>

      <section className="agent-grid">
        {agents.map((agent) => {
          const isSelected = selectedAgent?.id === agent.id;
          return (
            <div
              className={`card agent-card ${isSelected ? "clickable-card" : ""}`}
              key={agent.id}
              style={{ borderColor: isSelected ? "#6366f1" : undefined }}
              onClick={() => onSelectAgent(agent)}
            >
              <div className="agent-card-top">
                <div className="large-agent-icon">
                  <Bot size={28} />
                </div>

                <div className="agent-card-status">
                  <span className="live-dot" />
                  {agent.is_default ? "Production" : "Custom Agent"}
                </div>
              </div>

              <div className="agent-card-title">
                <div>
                  <h3>{agent.name}</h3>
                  <p>{agent.description || "Custom configured AI agent."}</p>
                </div>
                <span className="version-pill">{agent.version}</span>
              </div>

              <div className="agent-metrics">
                <Metric
                  label="Reliability"
                  value={suiteData && isSelected ? `${score}/100` : "Ready"}
                />
                <Metric
                  label="Tests"
                  value={suiteData && isSelected ? String(tests) : "0"}
                />
                <Metric
                  label="Critical failures"
                  value={suiteData && isSelected ? String(failures) : "0"}
                />
              </div>

              <div className="agent-card-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="run-button"
                  onClick={() => runTests(agent.id)}
                  disabled={running}
                >
                  {running ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      Run Security Tests
                    </>
                  )}
                </button>

                <button
                  className="outline-button"
                  onClick={() => onOpenDetailsModal(agent)}
                >
                  View Details
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          );
        })}

        <div className="card add-agent-card clickable-card" onClick={onOpenAddModal}>
          <div className="add-agent-icon">
            <Plus size={28} />
          </div>
          <h3>Connect another agent</h3>
          <p>Add custom system instructions or an external webhook URL to benchmark security.</p>
          <button className="outline-button">
            <Plus size={16} />
            Add Agent
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h3>Agent Health Signals</h3>
            <p>Current health and security posture for active agent</p>
          </div>
          <span className="health-badge">
            <CheckCircle2 size={15} />
            Healthy
          </span>
        </div>

        <div className="health-grid">
          <HealthItem
            icon={<ShieldCheck size={20} />}
            title="Security"
            value={suiteData ? `${score}/100` : "Active"}
          />
          <HealthItem
            icon={<FlaskConical size={20} />}
            title="Test Coverage"
            value={`${ATTACKS.length} vectors`}
          />
          <HealthItem
            icon={<ShieldAlert size={20} />}
            title="Active Shield"
            value="Enabled"
          />
          <HealthItem
            icon={<Activity size={20} />}
            title="API Status"
            value="Connected"
          />
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   TEST SUITES PAGE
========================================================= */

interface TestSuitesPageProps {
  running: boolean;
  runningSingle: string | null;
  runTests: () => void;
  runSingleTest: (attackType: string) => void;
  suiteData: SuiteResponse | null;
}

function TestSuitesPage({
  running,
  runningSingle,
  runTests,
  runSingleTest,
  suiteData,
}: TestSuitesPageProps) {
  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <h2>Security Test Suites</h2>
          <p>Run all adversarial attacks or click any single attack card to test individually.</p>
        </div>

        <button
          className="run-button"
          onClick={runTests}
          disabled={running}
        >
          {running ? (
            <>
              <Activity size={17} className="spin" />
              Running Full Suite...
            </>
          ) : (
            <>
              <Play size={17} />
              Run Full Suite
            </>
          )}
        </button>
      </div>

      <section className="suite-grid">
        {ATTACKS.map((attack, index) => {
          const result = suiteData?.results.find(
            (item) => item.attack_type.toLowerCase() === attack.toLowerCase()
          );
          const score = result?.secure_result.evaluation.score;
          const isThisSingleRunning = runningSingle === attack;

          return (
            <div
              className="card suite-card clickable-card"
              key={attack}
              onClick={() => !isThisSingleRunning && runSingleTest(attack)}
              title="Click to run this individual security test"
            >
              <div className="suite-number">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="suite-icon">
                {isThisSingleRunning ? (
                  <RefreshCw size={21} className="spin" color="#38bdf8" />
                ) : (
                  <FlaskConical size={21} />
                )}
              </div>

              <h3>{attack}</h3>
              <p>Adversarial benchmark evaluating agent resistance to {attack}.</p>

              <div className="suite-bottom">
                <span>
                  {isThisSingleRunning
                    ? "Testing..."
                    : result
                    ? `${score}/100`
                    : "Click to Test"}
                </span>

                <Status
                  status={
                    isThisSingleRunning
                      ? "Running"
                      : result
                      ? score! >= 70
                        ? "Passed"
                        : "Failed"
                      : "Running"
                  }
                />
              </div>
            </div>
          );
        })}
      </section>

      {suiteData && (
        <section className="card">
          <div className="card-header">
            <div>
              <h3>Latest Suite Run Results</h3>
              <p>{suiteData.total_tests} adversarial scenarios evaluated.</p>
            </div>
            <CheckCircle2 size={21} />
          </div>

          <TestTable tests={getTestsFromSuite(suiteData)} />
        </section>
      )}
    </div>
  );
}

/* =========================================================
   FAILURES PAGE
========================================================= */

interface FailuresPageProps {
  suiteData: SuiteResponse | null;
  selectedFailure: number;
  setSelectedFailure: (index: number) => void;
}

function FailuresPage({
  suiteData,
  selectedFailure,
  setSelectedFailure,
}: FailuresPageProps) {
  const failures = getFailuresFromSuite(suiteData);
  const currentFailure =
    failures.length > 0
      ? failures[Math.min(selectedFailure, failures.length - 1)]
      : null;

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <h2>Failure Center</h2>
          <p>Investigate security vulnerabilities and AI reasoning discovered by AgentGuard.</p>
        </div>

        <span className="failure-count">
          {failures.length} detected
        </span>
      </div>

      {!suiteData ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="No test results available"
          description="Run the security test suite from the Dashboard or Test Suites page first."
        />
      ) : failures.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={32} />}
          title="No failures detected"
          description="Your latest test suite did not detect any vulnerable-agent failures."
        />
      ) : currentFailure ? (
        <FailureViewer
          failures={failures}
          selectedFailure={selectedFailure}
          setSelectedFailure={setSelectedFailure}
          currentFailure={currentFailure}
        />
      ) : null}
    </div>
  );
}

/* =========================================================
   SETTINGS PAGE
========================================================= */

function SettingsPage({ suiteData }: { suiteData: SuiteResponse | null }) {
  const [apiStatus, setApiStatus] = useState("Checking...");

  const checkApi = async () => {
    setApiStatus("Checking...");
    try {
      const response = await fetch(`${API_BASE}/api/health`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setApiStatus(
        data.gemini_configured
          ? `Connected · ${data.model} Online`
          : "Connected · Gemini fallback mode"
      );
    } catch {
      setApiStatus("Offline · API unavailable");
    }
  };

  useEffect(() => {
    checkApi();
  }, []);

  const handleExportHtml = async () => {
    const suiteId = suiteData?.suite_id;
    if (!suiteId) {
      alert("Please run a test suite first to generate an exportable report.");
      return;
    }
    window.open(`${API_BASE}/api/reports/${suiteId}/export?format=html`, "_blank");
  };

  const handleExportJson = async () => {
    const suiteId = suiteData?.suite_id;
    if (!suiteId) {
      alert("Please run a test suite first to export JSON.");
      return;
    }
    window.open(`${API_BASE}/api/reports/${suiteId}/export?format=json`, "_blank");
  };

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <h2>Settings & Reports</h2>
          <p>Configure environments, monitor connections, and export security audit reports.</p>
        </div>
      </div>

      <section className="settings-grid">
        <div className="card settings-card">
          <div className="settings-icon">
            <Server size={21} />
          </div>
          <div>
            <h3>Backend API</h3>
            <p>FastAPI server connection</p>
          </div>
          <div className="setting-value">{apiStatus}</div>
          <button className="outline-button" onClick={checkApi}>
            <RefreshCw size={16} />
            Check Connection
          </button>
        </div>

        <div className="card settings-card">
          <div className="settings-icon">
            <KeyRound size={21} />
          </div>
          <div>
            <h3>AI Provider</h3>
            <p>Google Gemini evaluation engine</p>
          </div>
          <div className="setting-value">Configured via environment variables</div>
        </div>

        <div className="card settings-card">
          <div className="settings-icon">
            <Database size={21} />
          </div>
          <div>
            <h3>Database & Reports</h3>
            <p>Persistent SQLite storage</p>
          </div>
          <div className="setting-value">agentguard.db connected</div>
          <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
            <button className="outline-button" onClick={handleExportHtml} style={{ fontSize: "11px" }}>
              <Download size={14} /> Export HTML
            </button>
            <button className="outline-button" onClick={handleExportJson} style={{ fontSize: "11px" }}>
              <Download size={14} /> Export JSON
            </button>
          </div>
        </div>

        <div className="card settings-card">
          <div className="settings-icon">
            <ShieldCheck size={21} />
          </div>
          <div>
            <h3>Active Shield Guardrail</h3>
            <p>Real-time input/output defense proxy</p>
          </div>
          <div className="setting-value">AgentGuard v1.0.0 Active</div>
        </div>
      </section>

      <section className="card info-card">
        <Info size={20} />
        <div>
          <h3>Environment Information</h3>
          <p>Backend: http://127.0.0.1:8000</p>
          <p>Supported attack vectors: {ATTACKS.length} active benchmarks</p>
          <p>Evaluation mode: Dual comparative (Secure Target vs Vulnerable Baseline)</p>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   SHARED COMPONENTS
========================================================= */

function FailureViewer({
  failures,
  selectedFailure,
  setSelectedFailure,
  currentFailure,
}: {
  failures: Failure[];
  selectedFailure: number;
  setSelectedFailure: (index: number) => void;
  currentFailure: Failure;
}) {
  return (
    <div className="failure-grid">
      <div className="failure-list card">
        {failures.map((failure, index) => (
          <button
            key={`${failure.title}-${index}`}
            className={`failure-item ${selectedFailure === index ? "selected" : ""}`}
            onClick={() => setSelectedFailure(index)}
          >
            <div className="failure-icon">
              <AlertTriangle size={17} />
            </div>

            <div className="failure-item-content">
              <div className="failure-item-title">{failure.title}</div>
              <div className="failure-item-subtitle">{failure.description}</div>
              <Severity severity={failure.severity} />
            </div>

            <ChevronRight size={17} />
          </button>
        ))}
      </div>

      <div className="card trace-card">
        <div className="trace-header">
          <div>
            <h3>{currentFailure.title}</h3>
            <p>Execution trace</p>
          </div>
          <span className="critical-label">
            {currentFailure.severity.toUpperCase()}
          </span>
        </div>

        <div className="trace">
          {currentFailure.trace.map((line, index) => {
            const parts = line.split(" → ");
            return (
              <div className="trace-line" key={index}>
                <span className="trace-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="trace-source">{parts[0]}</span>
                <span className="trace-arrow">→</span>
                <span className={index === currentFailure.trace.length - 1 ? "trace-danger" : ""}>
                  {parts.slice(1).join(" → ")}
                </span>
              </div>
            );
          })}
        </div>

        <div className="ai-analysis">
          <div className="ai-icon">
            <Zap size={16} />
          </div>
          <div>
            <strong>AI Analysis & Reasoning</strong>
            <p>{currentFailure.reasoning}</p>

            {currentFailure.recommendations.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <strong>Security Recommendations:</strong>
                <ul>
                  {currentFailure.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TestTable({ tests }: { tests: Test[] }) {
  return (
    <div className="table">
      <div className="table-row table-head">
        <div>Scenario</div>
        <div>Category</div>
        <div>Severity</div>
        <div>Status</div>
        <div>Duration</div>
      </div>

      {tests.map((test) => (
        <div className="table-row" key={test.id}>
          <div className="scenario-name">
            <div className="scenario-icon">
              <FlaskConical size={15} />
            </div>
            {test.name}
          </div>

          <div className="muted">{test.category}</div>
          <div><Severity severity={test.severity} /></div>
          <div><Status status={test.status} /></div>
          <div className="muted">{test.duration}</div>
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function HealthItem({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="health-item">
      <div className="health-icon">{icon}</div>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card" style={{ padding: "40px", textAlign: "center" }}>
      <div style={{ marginBottom: "12px", opacity: 0.7 }}>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: "16px",
        marginBottom: "20px",
        borderRadius: "12px",
        background: "rgba(239, 68, 68, 0.12)",
        color: "#ef4444",
        border: "1px solid rgba(239, 68, 68, 0.3)",
      }}
    >
      <strong>Test Suite Error:</strong> {message}
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`nav-item ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  trend,
  trendPositive,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix: string;
  trend: string;
  trendPositive: boolean;
  color: string;
}) {
  return (
    <div className="card stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value}
        <small>{suffix}</small>
      </div>
      <div className={`stat-trend ${trendPositive ? "positive" : ""}`}>
        <TrendingUp size={13} />
        {trend}
      </div>
    </div>
  );
}

function CategoryBar({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  return (
    <div className="category">
      <div className="category-top">
        <span>{label}</span>
        <strong>{score}</strong>
      </div>
      <div className="progress">
        <div
          className={`progress-fill ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function Severity({ severity }: { severity: SeverityLevel }) {
  return (
    <span className={`severity ${severity.toLowerCase()}`}>
      <span />
      {severity}
    </span>
  );
}

function Status({ status }: { status: TestStatus }) {
  if (status === "Passed") {
    return (
      <span className="test-status passed">
        <CheckCircle2 size={15} />
        Passed
      </span>
    );
  }
  if (status === "Failed") {
    return (
      <span className="test-status failed">
        <XCircle size={15} />
        Failed
      </span>
    );
  }
  return (
    <span className="test-status running-status">
      <Activity size={15} />
      Not Run
    </span>
  );
}

export default App;
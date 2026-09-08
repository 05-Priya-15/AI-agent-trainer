import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import type { Failure, SeverityLevel, Test, TestStatus } from "../types";

export function FailureViewer({
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

export function TestTable({ tests }: { tests: Test[] }) {
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

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function HealthItem({
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

export function EmptyState({
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

export function ErrorBox({ message }: { message: string }) {
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

export function NavItem({
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

export function StatCard({
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

export function CategoryBar({
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

export function Severity({ severity }: { severity: SeverityLevel }) {
  return (
    <span className={`severity ${severity.toLowerCase()}`}>
      <span />
      {severity}
    </span>
  );
}

export function Status({ status }: { status: TestStatus }) {
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

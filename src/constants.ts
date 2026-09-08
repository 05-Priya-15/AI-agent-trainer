export const ATTACKS = [
  "prompt injection",
  "jailbreak",
  "sensitive data leakage",
  "instruction hijacking",
  "unauthorized tool request",
] as const;

export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? "http://127.0.0.1:8000"
    : "");

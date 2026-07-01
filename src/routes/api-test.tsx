import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/api-test")({
  component: ApiTestPage,
});

const BASE = "http://192.168.1.7:5000/api";

interface TestResult {
  name: string;
  url: string;
  method: string;
  status: "pending" | "pass" | "fail" | "running";
  statusCode?: number;
  error?: string;
  response?: string;
  ms?: number;
}

const TESTS: { name: string; url: string; method: string; body?: object }[] = [
  { name: "Health Check",      url: `${BASE}/health`,           method: "GET" },
  { name: "Auth Login",        url: `${BASE}/auth/login`,       method: "POST", body: { email: "sln@gmail.com", password: "123456" } },
  { name: "Get Products",      url: `${BASE}/products`,         method: "GET" },
  { name: "Get Customers",     url: `${BASE}/customers`,        method: "GET" },
  { name: "Get Dashboard",     url: `${BASE}/dashboard/stats`,  method: "GET" },
  { name: "Get Settings",      url: `${BASE}/settings`,         method: "GET" },
  { name: "Get Bills",         url: `${BASE}/bills`,            method: "GET" },
];

export default function ApiTestPage() {
  const [results, setResults] = useState<TestResult[]>(
    TESTS.map((t) => ({ name: t.name, url: t.url, method: t.method, status: "pending" }))
  );
  const [running, setRunning] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<string>("");

  useEffect(() => {
    setNetworkInfo(`Page origin: ${window.location.origin} | Target: ${BASE}`);
  }, []);

  async function runAll() {
    setRunning(true);
    setResults(TESTS.map((t) => ({ name: t.name, url: t.url, method: t.method, status: "pending" })));

    for (let i = 0; i < TESTS.length; i++) {
      const t = TESTS[i];

      // mark as running
      setResults((prev) => prev.map((r, idx) => idx === i ? { ...r, status: "running" } : r));

      const start = Date.now();
      try {
        const opts: RequestInit = {
          method: t.method,
          headers: { "Content-Type": "application/json" },
        };
        if (t.body) opts.body = JSON.stringify(t.body);

        const res = await fetch(t.url, opts);
        const ms = Date.now() - start;
        let text = "";
        try { text = await res.text(); } catch { text = "(no body)"; }

        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? {
                  ...r,
                  status: res.ok ? "pass" : "fail",
                  statusCode: res.status,
                  response: text.slice(0, 300),
                  ms,
                }
              : r
          )
        );
      } catch (err: any) {
        const ms = Date.now() - start;
        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? { ...r, status: "fail", error: err?.message || String(err), ms }
              : r
          )
        );
      }
    }
    setRunning(false);
  }

  const pass = results.filter((r) => r.status === "pass").length;
  const fail = results.filter((r) => r.status === "fail").length;

  return (
    <div style={{ fontFamily: "monospace", padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🔬 API Connectivity Test</h1>
      <p style={{ color: "#666", fontSize: 13, marginBottom: 16 }}>{networkInfo}</p>

      <button
        onClick={runAll}
        disabled={running}
        style={{
          background: running ? "#999" : "#c0392b",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "10px 24px",
          fontSize: 14,
          fontWeight: 700,
          cursor: running ? "not-allowed" : "pointer",
          marginBottom: 24,
        }}
      >
        {running ? "⏳ Running tests…" : "▶ Run All Tests"}
      </button>

      {(pass > 0 || fail > 0) && (
        <div style={{ marginBottom: 16, fontSize: 14 }}>
          <span style={{ color: "#27ae60", fontWeight: 700 }}>✅ {pass} passed</span>
          {"  "}
          <span style={{ color: "#c0392b", fontWeight: 700 }}>❌ {fail} failed</span>
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#1a1a2e", color: "#fff" }}>
            <th style={th}>Test</th>
            <th style={th}>Method</th>
            <th style={th}>URL</th>
            <th style={th}>Status</th>
            <th style={th}>Code</th>
            <th style={th}>Time</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
              <td style={td}><strong>{r.name}</strong></td>
              <td style={td}>
                <span style={{ background: r.method === "GET" ? "#2980b9" : "#8e44ad", color: "#fff", borderRadius: 4, padding: "2px 6px", fontSize: 11 }}>
                  {r.method}
                </span>
              </td>
              <td style={{ ...td, fontSize: 11, color: "#555", wordBreak: "break-all" }}>{r.url}</td>
              <td style={td}>
                {r.status === "pending" && <span style={{ color: "#999" }}>⏸ pending</span>}
                {r.status === "running" && <span style={{ color: "#f39c12" }}>⏳ running…</span>}
                {r.status === "pass"    && <span style={{ color: "#27ae60", fontWeight: 700 }}>✅ PASS</span>}
                {r.status === "fail"    && (
                  <span style={{ color: "#c0392b", fontWeight: 700 }}>
                    ❌ FAIL
                    {r.error && <div style={{ fontSize: 11, fontWeight: 400, marginTop: 2, color: "#c0392b" }}>{r.error}</div>}
                  </span>
                )}
              </td>
              <td style={td}>{r.statusCode ?? "—"}</td>
              <td style={td}>{r.ms != null ? `${r.ms}ms` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Response details */}
      {results.some((r) => r.response || r.error) && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Response Details</h2>
          {results.map((r, i) =>
            (r.response || r.error) ? (
              <div key={i} style={{ marginBottom: 12, border: `1px solid ${r.status === "pass" ? "#27ae60" : "#c0392b"}`, borderRadius: 8, overflow: "hidden" }}>
                <div style={{ background: r.status === "pass" ? "#27ae60" : "#c0392b", color: "#fff", padding: "6px 12px", fontSize: 13, fontWeight: 700 }}>
                  {r.name} — {r.method} {r.url}
                </div>
                <pre style={{ margin: 0, padding: 12, fontSize: 12, background: "#1e1e1e", color: "#d4d4d4", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {r.error ? `ERROR: ${r.error}` : r.response}
                </pre>
              </div>
            ) : null
          )}
        </div>
      )}

      <div style={{ marginTop: 32, padding: 16, background: "#fff3cd", borderRadius: 8, fontSize: 13 }}>
        <strong>🔍 How to read results:</strong>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          <li><strong>ERR_CONNECTION_REFUSED</strong> → Backend not running or wrong IP/port</li>
          <li><strong>CORS error (no statusCode)</strong> → Backend CORS misconfigured or redirect happening</li>
          <li><strong>301/302 statusCode</strong> → Flask strict_slashes redirect breaking CORS preflight</li>
          <li><strong>401/403</strong> → Auth required — expected for protected routes without token</li>
          <li><strong>200 on health + CORS fail on others</strong> → CORS only broken on specific routes</li>
        </ul>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 12 };
const td: React.CSSProperties = { padding: "8px 12px", borderBottom: "1px solid #eee", verticalAlign: "top" };

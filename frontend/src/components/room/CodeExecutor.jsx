import React, { useState } from "react";

export default function CodeExecutor() {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");

  const handleRun = () => {
    const originalLog = console.log;
    const captured = [];

    console.log = (...args) => {
      const line = args
        .map((arg) => {
          if (typeof arg === "string") {
            return arg;
          }
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        })
        .join(" ");
      captured.push(line);
    };

    try {
      Function(code)();
      setOutput(captured.join("\n") || "Code executed successfully.");
    } catch (error) {
      setOutput(`Error: ${error?.message || String(error)}`);
    } finally {
      console.log = originalLog;
    }
  };

  const handleClear = () => {
    setCode("");
    setOutput("");
  };

  return (
    <div>
      <h4 className="sidebar-panel-title">Code Executor</h4>
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "10px",
          display: "grid",
          gap: "8px"
        }}
      >
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Write JavaScript code here..."
          style={{
            minHeight: "130px",
            resize: "vertical",
            padding: "8px",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            background: "#f3f4f6"
          }}
        />
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" className="secondary-btn" onClick={handleRun}>
            Run
          </button>
          <button type="button" className="secondary-btn" onClick={handleClear}>
            Clear
          </button>
        </div>
        <div
          style={{
            minHeight: "100px",
            maxHeight: "180px",
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            padding: "8px",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            background: "#f3f4f6"
          }}
        >
          {output || "Output will appear here..."}
        </div>
      </div>
    </div>
  );
}

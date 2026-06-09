import React, { useCallback, useEffect, useState } from "react";

const DELETE_KEY = "\u232b";

const BUTTONS = [
  "C",
  "(",
  ")",
  DELETE_KEY,
  "7",
  "8",
  "9",
  "/",
  "4",
  "5",
  "6",
  "*",
  "1",
  "2",
  "3",
  "-",
  "0",
  ".",
  "%",
  "+",
  "="
];

export default function ScientificCalculator() {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");

  const isSafeExpression = (value) => /^[0-9+\-*/%().\s]+$/.test(value);

  const handleButtonClick = useCallback((value) => {
    if (value === "C") {
      setExpression("");
      setResult("");
      return;
    }

    if (value === DELETE_KEY) {
      setExpression((prev) => prev.slice(0, -1));
      return;
    }

    if (value === "=") {
      const trimmed = expression.trim();
      if (!trimmed || !isSafeExpression(trimmed)) {
        setResult("Invalid expression");
        return;
      }

      try {
        const evaluated = Function("return " + trimmed)();
        setResult(String(evaluated));
      } catch {
        setResult("Error");
      }
      return;
    }

    setExpression((prev) => prev + value);
  }, [expression]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      const tag = String(target?.tagName || "").toLowerCase();
      const isTypingTarget =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable;

      if (isTypingTarget) {
        return;
      }

      const key = event.key;

      if (/^[0-9]$/.test(key) || ["+", "-", "*", "/", "%", "(", ")", "."].includes(key)) {
        event.preventDefault();
        handleButtonClick(key);
        return;
      }

      if (key === "Enter" || key === "=") {
        event.preventDefault();
        handleButtonClick("=");
        return;
      }

      if (key === "Backspace") {
        event.preventDefault();
        handleButtonClick(DELETE_KEY);
        return;
      }

      if (key === "Escape" || key.toLowerCase() === "c") {
        event.preventDefault();
        handleButtonClick("C");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleButtonClick]);

  return (
    <div>
      <h4 className="sidebar-panel-title">Calculator</h4>
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "10px"
        }}
      >
        <div
          style={{
            minHeight: "42px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "8px",
            background: "#ffffff",
            marginBottom: "8px",
            fontFamily: "monospace"
          }}
        >
          {expression || "0"}
        </div>
        <div className="muted-text" style={{ minHeight: "20px", marginBottom: "8px" }}>
          {result ? `Result: ${result}` : "Result:"}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "6px"
          }}
        >
          {BUTTONS.map((btn) => (
            <button
              key={btn}
              type="button"
              onClick={() => handleButtonClick(btn)}
              style={{
                border: "1px solid #d1d5db",
                background: "#e5e7eb",
                borderRadius: "6px",
                padding: "8px",
                cursor: "pointer"
              }}
            >
              {btn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

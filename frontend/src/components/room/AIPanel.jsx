import React, { useState } from "react";
import { AiApi, MaterialApi, NoteApi } from "../../services/api";

export default function AIPanel({ roomId, sharedContent }) {
  const [generated, setGenerated] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastType, setLastType] = useState("");

  const generate = async (type) => {
    setLoading(true);
    setError("");

    try {
      let content = String(sharedContent || "").trim();
      if (!content) {
        const latestShared = await NoteApi.getShared(roomId);
        content = String(latestShared?.data?.content || "").trim();
      }

      if (!content) {
        const latestMaterial = await MaterialApi.getLatest(roomId);
        const fileName = String(latestMaterial?.data?.fileName || "").trim();
        if (fileName) {
          content = `Study material file: ${fileName}. Generate helpful ${type === "MCQ" ? "MCQs" : "summary"} from this topic context.`;
        }
      }

      if (!content) {
        setError("No shared notes text found. Add Shared Notes content or upload study material first.");
        setGenerated("");
        return;
      }

      const res = await AiApi.generate(roomId, type, content);
      const aiContent = res?.data?.content || "";
      setGenerated(String(aiContent));
      setLastType(type);
    } catch (err) {
      const serverMessage = err?.response?.data?.message || err?.response?.data?.error;
      setError(serverMessage || "Failed to generate AI content.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h4 className="sidebar-panel-title">AI Tools</h4>
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
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => generate("SUMMARY")}
            disabled={loading}
          >
            Generate Summary
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => generate("MCQ")}
            disabled={loading}
          >
            Generate MCQs
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => lastType && generate(lastType)}
            disabled={loading || !lastType}
          >
            Regenerate
          </button>
        </div>

        {loading && <p className="muted-text">Generating...</p>}
        {error && <p className="muted-text">{error}</p>}

        <div
          style={{
            minHeight: "120px",
            maxHeight: "220px",
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            padding: "10px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            background: "#f3f4f6",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: "13px",
            lineHeight: 1.45
          }}
        >
          {generated || "Generated summary or MCQs will appear here."}
        </div>
      </div>
    </div>
  );
}


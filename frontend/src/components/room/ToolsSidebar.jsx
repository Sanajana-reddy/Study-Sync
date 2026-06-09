import React, { useEffect, useRef, useState } from "react";
import AIPanel from "./AIPanel";
import PomodoroTimer from "./PomodoroTimer";
import DoubtButton from "./DoubtButton";
import ScientificCalculator from "./ScientificCalculator";
import SettingsPanel from "./SettingsPanel";
import CodeExecutor from "./CodeExecutor";

const TOOLS = [
  { id: "ai", label: "AI", hasPanel: true },
  { id: "calculator", label: "Calculator", hasPanel: true },
  { id: "pomodoro", label: "Pomodoro", hasPanel: true },
  { id: "participants", label: "Participants", hasPanel: true },
  { id: "settings", label: "Settings", hasPanel: true },
  { id: "speaker", label: "Speaker", hasPanel: false },
  { id: "chat", label: "Chat", hasPanel: true },
  { id: "code", label: "Code Executor", hasPanel: true }
];

const LEFT_COLUMN_TOOL_IDS = ["ai", "calculator", "pomodoro", "participants", "settings"];
const RIGHT_COLUMN_TOOL_IDS = ["speaker", "chat", "code"];

export default function ToolsSidebar({
  roomId,
  sharedContent,
  client,
  activeTool,
  onToolChange,
  onRaiseDoubt,
  participants = [],
  messages = [],
  onSendChatMessage,
  isCalling = false,
  isMuted = false,
  hasLocalStream = false,
  hasPeerConnection = false,
  onStartCall,
  onEndCall,
  onToggleMute
}) {
  const [speakerOn, setSpeakerOn] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (activeTool === "chat" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTool]);

  const handleToolClick = (tool) => {
    if (tool.hasPanel) {
      onToolChange(activeTool === tool.id ? null : tool.id);
    } else if (tool.id === "speaker") {
      setSpeakerOn((v) => !v);
    } else {
      onToolChange(null);
    }
  };

  const handleSend = () => {
    const message = chatInput.trim();
    if (!message) {
      return;
    }
    onSendChatMessage?.(message);
    setChatInput("");
  };

  return (
    <div className="tools-sidebar">
      <div className="tools-call-controls">
        <button type="button" className="secondary-btn" onClick={onStartCall} disabled={isCalling}>
          Start Call
        </button>
        <button type="button" className="secondary-btn" onClick={onEndCall} disabled={!isCalling}>
          End Call
        </button>
        <button
          type="button"
          className="secondary-btn"
          onClick={onToggleMute}
          disabled={!isCalling || !hasLocalStream || !hasPeerConnection}
        >
          {isMuted ? "Unmute" : "Mute"}
        </button>
      </div>

      <div className="tools-sidebar-buttons-grid">
        <div className="tools-sidebar-col">
          {LEFT_COLUMN_TOOL_IDS.map((toolId) => {
            const tool = TOOLS.find((item) => item.id === toolId);
            if (!tool) {
              return null;
            }
            return (
              <button
                key={tool.id}
                type="button"
                className={`tool-btn ${activeTool === tool.id ? "active" : ""} ${tool.id === "speaker" && speakerOn ? "on" : ""}`}
                onClick={() => handleToolClick(tool)}
                title={tool.label}
              >
                <span className="tool-btn-label">{tool.label}</span>
              </button>
            );
          })}
        </div>

        <div className="tools-sidebar-col">
          {RIGHT_COLUMN_TOOL_IDS.map((toolId) => {
            const tool = TOOLS.find((item) => item.id === toolId);
            if (!tool) {
              return null;
            }
            return (
              <button
                key={tool.id}
                type="button"
                className={`tool-btn ${activeTool === tool.id ? "active" : ""} ${tool.id === "speaker" && speakerOn ? "on" : ""}`}
                onClick={() => handleToolClick(tool)}
                title={tool.label}
              >
                <span className="tool-btn-label">{tool.label}</span>
              </button>
            );
          })}

          <div className="tool-btn-doubt">
            <DoubtButton onRaiseDoubt={onRaiseDoubt} />
          </div>
        </div>
      </div>

      <div className="tools-sidebar-panel">
        {activeTool === "ai" && <AIPanel roomId={roomId} sharedContent={sharedContent} />}
        {activeTool === "calculator" && <ScientificCalculator />}
        {activeTool === "settings" && <SettingsPanel />}
        {activeTool === "code" && <CodeExecutor />}
        {activeTool === "pomodoro" && <PomodoroTimer roomId={roomId} client={client} />}
        {activeTool === "participants" && (
          <div className="participants-panel">
            <h4 className="sidebar-panel-title">Participants</h4>
            <div className="participants-list">
              {participants.length > 0 ? (
                participants.map((participant) => (
                  <div key={participant.userId} className="participant-item">
                    {participant.username}
                  </div>
                ))
              ) : (
                <p className="muted-text tools-placeholder">No active participants</p>
              )}
            </div>
          </div>
        )}
        {activeTool === "chat" && (
          <div className="chat-panel">
            <h4 className="sidebar-panel-title">Room Chat</h4>
            <div className="chat-messages">
              {messages.length > 0 ? (
                messages.map((msg, idx) => (
                  <div key={`${msg.sender}-${msg.timestamp}-${idx}`} className="chat-message">
                    <span className="chat-sender">{msg.sender}:</span> {msg.message}
                  </div>
                ))
              ) : (
                <p className="muted-text tools-placeholder">No messages yet</p>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="chat-input-row">
              <input
                type="text"
                className="chat-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message"
              />
              <button type="button" className="secondary-btn" onClick={handleSend}>
                Send
              </button>
            </div>
          </div>
        )}
        {activeTool && !["ai", "calculator", "settings", "pomodoro", "participants", "chat", "code"].includes(activeTool) && (
          <p className="muted-text tools-placeholder">Coming soon</p>
        )}
      </div>
    </div>
  );
}

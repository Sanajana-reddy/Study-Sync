import React, { useEffect, useState } from "react";

const STORAGE_KEY = "studysync_settings";

const DEFAULT_SETTINGS = {
  showCursor: true,
  soundEnabled: true,
  autoPlayVoice: true,
  theme: "light"
};

export default function SettingsPanel() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      setSettings((prev) => ({
        ...prev,
        ...parsed
      }));
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const handleToggle = (key) => (event) => {
    setSettings((prev) => ({
      ...prev,
      [key]: event.target.checked
    }));
  };

  const handleThemeChange = (event) => {
    setSettings((prev) => ({
      ...prev,
      theme: event.target.value
    }));
  };

  return (
    <div>
      <h4 className="sidebar-panel-title">Settings</h4>
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "10px",
          display: "grid",
          gap: "10px"
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            checked={settings.showCursor}
            onChange={handleToggle("showCursor")}
          />
          <span>Show Live Cursor</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={handleToggle("soundEnabled")}
          />
          <span>Enable Sound Notifications</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            checked={settings.autoPlayVoice}
            onChange={handleToggle("autoPlayVoice")}
          />
          <span>Auto Play Voice</span>
        </label>

        <label style={{ display: "grid", gap: "6px" }}>
          <span>Theme</span>
          <select value={settings.theme} onChange={handleThemeChange} style={{ padding: "6px" }}>
            <option value="light">Light</option>
            <option value="soft light">Soft Light</option>
            <option value="minimal">Minimal</option>
          </select>
        </label>
      </div>
    </div>
  );
}

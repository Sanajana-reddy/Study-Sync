import React, { useState } from "react";
import WhiteboardCanvas from "./WhiteboardCanvas";

export default function WhiteboardToggle({ roomId, client }) {
  const [enabled, setEnabled] = useState(false);

  return (
    <>
      <button
        type="button"
        className={enabled ? "secondary-btn active" : "secondary-btn"}
        onClick={() => setEnabled((v) => !v)}
      >
        {enabled ? "Hide whiteboard" : "Show whiteboard"}
      </button>
      {enabled && (
        <div className="whiteboard-wrapper">
          <WhiteboardCanvas roomId={roomId} client={client} onClose={() => setEnabled(false)} />
        </div>
      )}
    </>
  );
}

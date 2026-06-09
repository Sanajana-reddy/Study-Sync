import React from "react";

export default function SharedNotesEditor({ value, onChange }) {
  return (
    <textarea
      className="notes-textarea shared-notes"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Shared notes for this room. Everyone can see and edit."
    />
  );
}


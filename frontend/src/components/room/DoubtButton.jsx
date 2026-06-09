import React from "react";

export default function DoubtButton({ onRaiseDoubt }) {
  return (
    <div className="doubt-button-container">
      <button
        type="button"
        className="secondary-btn"
        onClick={onRaiseDoubt}
      >
        Raise doubt
      </button>
    </div>
  );
}

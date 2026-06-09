import React, { useEffect, useRef, useState } from "react";

export default function PrivateNotesPanel({ value, onSave }) {
  const [content, setContent] = useState(value || "");
  const [paperStyle, setPaperStyle] = useState("plain");
  const debounceTimerRef = useRef(null);
  const editorRef = useRef(null);

  const scheduleSave = (nextContent) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (nextContent !== value) {
        onSave(nextContent);
      }
    }, 500);
  };

  useEffect(() => {
    const nextValue = value || "";
    setContent(nextValue);
    if (editorRef.current && editorRef.current.innerHTML !== nextValue) {
      editorRef.current.innerHTML = nextValue;
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleInput = (e) => {
    const nextContent = e.currentTarget.innerHTML;
    setContent(nextContent);
    scheduleSave(nextContent);
  };

  const handleBlur = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (content !== value) {
      onSave(content);
    }
  };

  const applyFormat = (command, commandValue = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    const nextContent = editorRef.current?.innerHTML || "";
    setContent(nextContent);
    scheduleSave(nextContent);
  };

  const handleEditorKeyDown = (e) => {
    if (!(e.ctrlKey || e.metaKey)) {
      return;
    }

    const key = e.key.toLowerCase();
    if (key === "b" || key === "u" || key === "i") {
      e.preventDefault();
      if (key === "b") {
        applyFormat("bold");
      } else if (key === "u") {
        applyFormat("underline");
      } else {
        applyFormat("italic");
      }
    }
  };

  return (
    <div className="private-notes-editor">
      <div className="private-editor-toolbar">
        <button type="button" className="secondary-btn" onClick={() => applyFormat("bold")}>
          Bold
        </button>
        <button type="button" className="secondary-btn" onClick={() => applyFormat("underline")}>
          Underline
        </button>
        <button type="button" className="secondary-btn" onClick={() => applyFormat("italic")}>
          Italic
        </button>
        <button type="button" className="secondary-btn" onClick={() => applyFormat("hiliteColor", "#fef08a")}>
          Highlight
        </button>
        <select
          className="private-editor-layout-select"
          value={paperStyle}
          onChange={(e) => setPaperStyle(e.target.value)}
          aria-label="Private notes layout"
        >
          <option value="plain">Plain</option>
          <option value="lined">Lined</option>
          <option value="grid">Grid</option>
        </select>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className={`private-editor private-editor-${paperStyle}`}
        onInput={handleInput}
        onBlur={handleBlur}
        onKeyDown={handleEditorKeyDown}
        data-placeholder="Your private notes. Only you can see these."
      />
    </div>
  );
}


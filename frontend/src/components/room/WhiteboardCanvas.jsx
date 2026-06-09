import React, { useEffect, useRef, useState } from "react";

const DEFAULT_COLOR = "#1f2933";
const DEFAULT_STROKE_WIDTH = 2;

export default function WhiteboardCanvas({ roomId, client, isConnected = false, onClose, inline = false }) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const subscriptionRef = useRef(null);
  const lastPointRef = useRef(null);

  const [activeTool, setActiveTool] = useState("pen");
  const [strokeColor, setStrokeColor] = useState(DEFAULT_COLOR);
  const [strokeWidth, setStrokeWidth] = useState(DEFAULT_STROKE_WIDTH);

  const toolRef = useRef("pen");
  const colorRef = useRef(DEFAULT_COLOR);
  const widthRef = useRef(DEFAULT_STROKE_WIDTH);

  useEffect(() => {
    toolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    colorRef.current = strokeColor;
  }, [strokeColor]);

  useEffect(() => {
    widthRef.current = strokeWidth;
  }, [strokeWidth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !client || !isConnected || !client.connected) {
      return;
    }

    const context = canvas.getContext("2d");

    const applyStrokeStyle = (ctx, tool, color, width) => {
      ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      applyStrokeStyle(context, toolRef.current, colorRef.current, widthRef.current);
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    const startDrawing = (e) => {
      isDrawingRef.current = true;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      lastPointRef.current = { x, y };
    };

    const draw = (e) => {
      if (!isDrawingRef.current) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (lastPointRef.current) {
        const currentTool = toolRef.current;
        const currentColor = colorRef.current;
        const currentWidth = widthRef.current;

        applyStrokeStyle(context, currentTool, currentColor, currentWidth);
        context.beginPath();
        context.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        context.lineTo(x, y);
        context.stroke();

        client.publish({
          destination: `/app/whiteboard/${roomId}`,
          body: JSON.stringify({
            type: "stroke",
            tool: currentTool,
            color: currentColor,
            width: currentWidth,
            from: {
              x: (lastPointRef.current.x / rect.width) * 100,
              y: (lastPointRef.current.y / rect.height) * 100
            },
            to: {
              x: (x / rect.width) * 100,
              y: (y / rect.height) * 100
            }
          })
        });
      }

      lastPointRef.current = { x, y };
    };

    const stopDrawing = () => {
      isDrawingRef.current = false;
      lastPointRef.current = null;
    };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);

    subscriptionRef.current = client.subscribe(`/topic/whiteboard/${roomId}`, (message) => {
      try {
        const payload = JSON.parse(message.body);
        if (payload.type === "stroke" && payload.from && payload.to) {
          const rect = canvas.getBoundingClientRect();
          const fromX = (payload.from.x / 100) * rect.width;
          const fromY = (payload.from.y / 100) * rect.height;
          const toX = (payload.to.x / 100) * rect.width;
          const toY = (payload.to.y / 100) * rect.height;

          applyStrokeStyle(
            context,
            payload.tool || "pen",
            payload.color || DEFAULT_COLOR,
            payload.width || DEFAULT_STROKE_WIDTH
          );
          context.beginPath();
          context.moveTo(fromX, fromY);
          context.lineTo(toX, toY);
          context.stroke();
        } else if (payload.type === "clear") {
          context.clearRect(0, 0, canvas.width, canvas.height);
        }
      } catch (err) {
        console.error("Error parsing whiteboard message:", err);
      }
    });

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseleave", stopDrawing);
      window.removeEventListener("resize", updateCanvasSize);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [client, roomId, isConnected]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas || !client || !client.connected) {
      return;
    }

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    client.publish({
      destination: `/app/whiteboard/${roomId}`,
      body: JSON.stringify({
        type: "clear"
      })
    });
  };

  const toolbar = (
    <div className="whiteboard-toolbar">
      <button
        type="button"
        className={activeTool === "pen" ? "secondary-btn active" : "secondary-btn"}
        onClick={() => setActiveTool("pen")}
      >
        Pen
      </button>
      <button
        type="button"
        className={activeTool === "eraser" ? "secondary-btn active" : "secondary-btn"}
        onClick={() => setActiveTool("eraser")}
      >
        Eraser
      </button>
      <label>
        Color
        <input
          type="color"
          value={strokeColor}
          onChange={(e) => setStrokeColor(e.target.value)}
          disabled={activeTool === "eraser"}
          aria-label="Stroke color"
        />
      </label>
      <label>
        Thickness
        <select
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          aria-label="Stroke thickness"
        >
          <option value={2}>2px</option>
          <option value={4}>4px</option>
          <option value={6}>6px</option>
          <option value={8}>8px</option>
          <option value={12}>12px</option>
          <option value={16}>16px</option>
        </select>
      </label>
      <button type="button" className="secondary-btn" onClick={handleClear}>
        Clear
      </button>
      {!inline && onClose && (
        <button type="button" className="ghost-btn" onClick={onClose}>
          Close
        </button>
      )}
    </div>
  );

  const content = (
    <>
      {toolbar}
      <canvas ref={canvasRef} className="whiteboard-canvas" />
    </>
  );

  if (inline) {
    return (
      <div className="whiteboard-inline">
        <div className="whiteboard-container whiteboard-container-inline">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="whiteboard-container" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      {content}
    </div>
  );
}

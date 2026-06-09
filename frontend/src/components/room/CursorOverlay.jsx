import React, { useEffect, useState, useRef } from "react";

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#ca8a04", "#9333ea", "#ea580c"];

export default function CursorOverlay({ roomId, client, containerRef }) {
  const [cursors, setCursors] = useState(new Map());
  const subscriptionRef = useRef(null);
  const colorMapRef = useRef(new Map());
  const colorIndexRef = useRef(0);

  useEffect(() => {
    if (!client || !client.connected || !containerRef?.current) {
      return;
    }

    const container = containerRef.current;
    let mouseMoveTimer = null;
    let cleanupInterval = null;

    const handleMouseMove = (e) => {
      if (mouseMoveTimer) {
        clearTimeout(mouseMoveTimer);
      }

      mouseMoveTimer = setTimeout(() => {
        if (client && client.connected) {
          const rect = container.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;

          client.publish({
            destination: `/app/cursor/${roomId}`,
            body: JSON.stringify({
              x,
              y,
              timestamp: Date.now()
            })
          });
        }
      }, 50);
    };

    container.addEventListener("mousemove", handleMouseMove);

    subscriptionRef.current = client.subscribe(`/topic/cursor/${roomId}`, (message) => {
      try {
        const payload = JSON.parse(message.body);
        if (payload.x != null && payload.y != null && payload.username) {
          const username = payload.username;
          
          if (!colorMapRef.current.has(username)) {
            const color = COLORS[colorIndexRef.current % COLORS.length];
            colorMapRef.current.set(username, color);
            colorIndexRef.current++;
          }

          setCursors((prev) => {
            const next = new Map(prev);
            const timestamp = payload.timestamp || Date.now();
            next.set(username, {
              x: payload.x,
              y: payload.y,
              color: colorMapRef.current.get(username),
              timestamp: timestamp
            });
            return next;
          });
        }
      } catch (err) {
        console.error("Error parsing cursor message:", err);
      }
    });

    cleanupInterval = setInterval(() => {
      const now = Date.now();
      setCursors((prev) => {
        const next = new Map(prev);
        let changed = false;
        for (const [username, cursor] of next.entries()) {
          if (now - cursor.timestamp > 2000) {
            next.delete(username);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      if (mouseMoveTimer) {
        clearTimeout(mouseMoveTimer);
      }
      if (cleanupInterval) {
        clearInterval(cleanupInterval);
      }
    };
  }, [client, roomId, containerRef]);

  return (
    <div className="cursor-overlay">
      {Array.from(cursors.entries()).map(([username, cursor]) => (
        <div
          key={username}
          className="cursor-marker"
          style={{
            left: `${cursor.x}%`,
            top: `${cursor.y}%`,
            borderColor: cursor.color
          }}
        >
          <div className="cursor-label" style={{ backgroundColor: cursor.color }}>
            {username}
          </div>
        </div>
      ))}
    </div>
  );
}

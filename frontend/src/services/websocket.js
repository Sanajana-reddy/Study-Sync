import { Client } from "@stomp/stompjs";
import { API_BASE_URL } from "./api";

export function createStompClient(onConnect, onError) {
  const socketUrl = API_BASE_URL.replace(/\/api$/, "").replace(/^http/, "ws") + "/ws";
  const token = localStorage.getItem("studysync_token");

  const client = new Client({
    brokerURL: socketUrl,
    connectHeaders: token
      ? {
          Authorization: `Bearer ${token}`
        }
      : {},
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: (frame) => {
      if (onConnect) {
        onConnect(frame, client);
      }
    },
    onStompError: (frame) => {
      console.error("STOMP error:", frame);
      if (onError) {
        onError(frame);
      }
    },
    onWebSocketError: (event) => {
      console.error("WebSocket error:", event);
      if (onError) {
        onError(event);
      }
    }
  });

  client.activate();
  return client;
}


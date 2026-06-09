import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, MaterialApi, NoteApi } from "../services/api";
import { createStompClient } from "../services/websocket";
import SharedNotesEditor from "../components/room/SharedNotesEditor";
import PrivateNotesPanel from "../components/room/PrivateNotesPanel";
import WhiteboardCanvas from "../components/room/WhiteboardCanvas";
import ToolsSidebar from "../components/room/ToolsSidebar";

const CURSOR_COLORS = ["#2563eb", "#dc2626", "#16a34a", "#ca8a04", "#9333ea", "#ea580c"];

function getCursorColor(userId) {
  const key = String(userId || "guest");
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [sharedNote, setSharedNote] = useState("");
  const [privateNote, setPrivateNote] = useState("");
  const [status, setStatus] = useState("Connecting...");
  const [stompClient, setStompClient] = useState(null);
  const [viewMode, setViewMode] = useState("workspace"); // "workspace" | "material"
  const [activeTool, setActiveTool] = useState(null);
  const [cursors, setCursors] = useState({});
  const [doubts, setDoubts] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState(null);
  const [materialStatus, setMaterialStatus] = useState("");
  const [materialBlobUrl, setMaterialBlobUrl] = useState("");
  const [localStream, setLocalStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const isLocalUpdateRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const studyAreaRef = useRef(null);
  const materialFileInputRef = useRef(null);
  const lastCursorPublishRef = useRef(0);
  const currentCursorRef = useRef({ x: 50, y: 50 });
  const doubtTimeoutsRef = useRef(new Map());
  const doubtCounterRef = useRef(0);
  const remoteAudioRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const stompClientRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);

  const numericRoomId = useMemo(() => Number(roomId), [roomId]);
  const localUserId = useMemo(() => user?.username || "guest", [user]);
  const localCursorColor = useMemo(() => getCursorColor(localUserId), [localUserId]);
  const isTeacher = user?.role === "TEACHER";
  const apiHost = useMemo(() => API_BASE_URL.replace(/\/api$/, ""), []);
  const isWsConnected = status === "Connected";

  const fetchMaterials = useCallback(async () => {
    try {
      const res = await MaterialApi.list(numericRoomId);
      const nextMaterials = Array.isArray(res.data) ? res.data : [];
      setMaterials(nextMaterials);
      setSelectedMaterialId((prev) => {
        if (nextMaterials.length === 0) {
          return null;
        }
        if (prev && nextMaterials.some((item) => item.id === prev)) {
          return prev;
        }
        return nextMaterials[0].id;
      });
    } catch {
      // Backward-compatible fallback for backend versions that only expose latest material.
      try {
        const latestRes = await MaterialApi.getLatest(numericRoomId);
        const latest = latestRes.data ? [latestRes.data] : [];
        setMaterials(latest);
        setSelectedMaterialId(latest.length > 0 ? latest[0].id : null);
        setMaterialStatus("Showing latest file only. Restart backend to enable full uploaded-files list.");
      } catch {
        setMaterials([]);
        setSelectedMaterialId(null);
      }
    }
  }, [numericRoomId]);

  const selectedMaterial = useMemo(
    () => materials.find((item) => item.id === selectedMaterialId) || null,
    [materials, selectedMaterialId]
  );

  const closePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setPeerConnection(null);
    pendingIceCandidatesRef.current = [];
  }, []);

  const stopLocalAudioStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
  }, []);

  const clearRemoteAudio = useCallback(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  }, []);

  const createPeerConnection = useCallback(
    (stream) => {
      const pc = new RTCPeerConnection();

      pc.onicecandidate = (event) => {
        const client = stompClientRef.current;
        if (!event.candidate || !client || !client.connected) {
          return;
        }

        client.publish({
          destination: `/app/webrtc/ice/${numericRoomId}`,
          body: JSON.stringify({
            sender: localUserId,
            candidate: event.candidate
          })
        });
      };

      pc.ontrack = (event) => {
        if (!remoteAudioRef.current) {
          return;
        }
        const [remoteStream] = event.streams;
        if (!remoteStream) {
          return;
        }
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(() => {});
      };

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      peerConnectionRef.current = pc;
      setPeerConnection(pc);
      return pc;
    },
    [numericRoomId, localUserId]
  );

  const handleIncomingOffer = useCallback(
    async (payload) => {
      if (!payload?.sdp || payload.sender === localUserId) {
        return;
      }

      try {
        let stream = localStreamRef.current;
        if (!stream) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          localStreamRef.current = stream;
          setLocalStream(stream);
        }
        stream.getAudioTracks().forEach((track) => {
          track.enabled = true;
        });
        setIsMuted(false);

        closePeerConnection();
        const pc = createPeerConnection(stream);

        await pc.setRemoteDescription(
          new RTCSessionDescription({
            type: "offer",
            sdp: payload.sdp
          })
        );

        if (pendingIceCandidatesRef.current.length > 0) {
          const queued = [...pendingIceCandidatesRef.current];
          pendingIceCandidatesRef.current = [];
          await Promise.all(
            queued.map((candidate) => pc.addIceCandidate(new RTCIceCandidate(candidate)))
          );
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        const client = stompClientRef.current;
        if (client && client.connected) {
          client.publish({
            destination: `/app/webrtc/answer/${numericRoomId}`,
            body: JSON.stringify({
              sender: localUserId,
              sdp: answer.sdp,
              type: answer.type
            })
          });
        }

        setIsCalling(true);
      } catch (err) {
        console.error("Failed to handle WebRTC offer:", err);
      }
    },
    [localUserId, closePeerConnection, createPeerConnection, numericRoomId]
  );

  const handleIncomingAnswer = useCallback(
    async (payload) => {
      if (!payload?.sdp || payload.sender === localUserId || !peerConnectionRef.current) {
        return;
      }

      try {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription({
            type: "answer",
            sdp: payload.sdp
          })
        );

        if (pendingIceCandidatesRef.current.length > 0) {
          const queued = [...pendingIceCandidatesRef.current];
          pendingIceCandidatesRef.current = [];
          await Promise.all(
            queued.map((candidate) =>
              peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
            )
          );
        }

        setIsCalling(true);
      } catch (err) {
        console.error("Failed to handle WebRTC answer:", err);
      }
    },
    [localUserId]
  );

  const handleIncomingIceCandidate = useCallback(
    async (payload) => {
      if (!payload?.candidate || payload.sender === localUserId || !peerConnectionRef.current) {
        return;
      }

      try {
        if (!peerConnectionRef.current.remoteDescription) {
          pendingIceCandidatesRef.current.push(payload.candidate);
          return;
        }
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (err) {
        console.error("Failed to add ICE candidate:", err);
      }
    },
    [localUserId]
  );

  const handleStartCall = useCallback(async () => {
    const client = stompClientRef.current;
    if (!client || !client.connected) {
      return;
    }

    try {
      closePeerConnection();

      let stream = localStreamRef.current;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        setLocalStream(stream);
      }

      stream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
      setIsMuted(false);

      const pc = createPeerConnection(stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      client.publish({
        destination: `/app/webrtc/offer/${numericRoomId}`,
        body: JSON.stringify({
          sender: localUserId,
          sdp: offer.sdp,
          type: offer.type
        })
      });

      setIsCalling(true);
    } catch (err) {
      console.error("Failed to start call:", err);
    }
  }, [closePeerConnection, createPeerConnection, numericRoomId, localUserId]);

  const handleEndCall = useCallback(() => {
    closePeerConnection();
    stopLocalAudioStream();
    clearRemoteAudio();
    setIsMuted(false);
    setIsCalling(false);
  }, [closePeerConnection, stopLocalAudioStream, clearRemoteAudio]);

  const handleToggleMute = useCallback(() => {
    if (!localStreamRef.current) {
      return;
    }

    const nextMuted = !isMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);
  }, [isMuted]);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const sharedRes = await NoteApi.getShared(numericRoomId);
        if (sharedRes.data && sharedRes.data.content != null) {
          setSharedNote(sharedRes.data.content);
        }
      } catch {
        // shared note may not exist yet
      }

      try {
        const privateRes = await NoteApi.getPrivate(numericRoomId);
        if (privateRes.data && privateRes.data.content != null) {
          setPrivateNote(privateRes.data.content);
        }
      } catch {
        // no private note yet
      }

      await fetchMaterials();
    };

    loadInitial();
  }, [numericRoomId, fetchMaterials]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchMaterials();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchMaterials]);

  useEffect(() => {
    let notesSubscription = null;
    let cursorSubscription = null;
    let doubtSubscription = null;
    let participantsSubscription = null;
    let chatSubscription = null;
    let webrtcOfferSubscription = null;
    let webrtcAnswerSubscription = null;
    let webrtcIceSubscription = null;
    setParticipants([]);
    setMessages([]);

    const onConnect = (frame, client) => {
      setStatus("Connected");

      if (!client || !client.connected) {
        return;
      }

      setParticipants((prev) => {
        if (prev.some((p) => p.userId === localUserId)) {
          return prev;
        }
        return [...prev, { userId: localUserId, username: localUserId }];
      });

      notesSubscription = client.subscribe(`/topic/notes/${numericRoomId}`, (message) => {
        try {
          const payload = JSON.parse(message.body);
          if (payload.content != null && !isLocalUpdateRef.current) {
            setSharedNote(payload.content);
          }
          isLocalUpdateRef.current = false;
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      });

      cursorSubscription = client.subscribe(`/topic/cursor/${numericRoomId}`, (message) => {
        try {
          const payload = JSON.parse(message.body);
          if (payload.userId != null && payload.x != null && payload.y != null) {
            const incomingUserId = String(payload.userId);
            setCursors((prev) => ({
              ...prev,
              [incomingUserId]: {
                x: payload.x,
                y: payload.y,
                color: payload.color || getCursorColor(incomingUserId)
              }
            }));
          }
        } catch (err) {
          console.error("Error parsing cursor message:", err);
        }
      });

      doubtSubscription = client.subscribe(`/topic/doubt/${numericRoomId}`, (message) => {
        try {
          const payload = JSON.parse(message.body);
          if (payload.userId != null && payload.x != null && payload.y != null) {
            doubtCounterRef.current += 1;
            const doubtId = `${payload.userId}-${Date.now()}-${doubtCounterRef.current}`;
            const doubt = {
              id: doubtId,
              userId: String(payload.userId),
              x: payload.x,
              y: payload.y,
              createdAt: Date.now()
            };

            setDoubts((prev) => [...prev, doubt]);

            const timeoutId = setTimeout(() => {
              setDoubts((prev) => prev.filter((item) => item.id !== doubtId));
              doubtTimeoutsRef.current.delete(doubtId);
            }, 5000);

            doubtTimeoutsRef.current.set(doubtId, timeoutId);
          }
        } catch (err) {
          console.error("Error parsing doubt message:", err);
        }
      });

      participantsSubscription = client.subscribe(`/topic/participants/${numericRoomId}`, (message) => {
        try {
          const payload = JSON.parse(message.body);

          if (Array.isArray(payload)) {
            setParticipants(
              payload.filter((item) => item && item.username).map((item) => ({
                userId: String(item.userId || item.username),
                username: item.username
              }))
            );
            return;
          }

          const eventType = String(payload.type || payload.event || "").toLowerCase();
          const userId = String(payload.userId || payload.username || "");
          const username = payload.username || userId;
          if (!userId || !username) {
            return;
          }

          setParticipants((prev) => {
            if (eventType === "leave") {
              return prev.filter((p) => p.userId !== userId);
            }

            const exists = prev.some((p) => p.userId === userId);
            if (exists) {
              return prev;
            }
            return [...prev, { userId, username }];
          });
        } catch (err) {
          console.error("Error parsing participants message:", err);
        }
      });

      chatSubscription = client.subscribe(`/topic/chat/${numericRoomId}`, (message) => {
        try {
          const payload = JSON.parse(message.body);
          const sender = payload.sender || payload.username;
          if (sender && payload.message != null) {
            setMessages((prev) => [
              ...prev,
              {
                sender: String(sender),
                message: String(payload.message),
                timestamp: payload.timestamp || Date.now()
              }
            ]);
          }
        } catch (err) {
          console.error("Error parsing chat message:", err);
        }
      });

      webrtcOfferSubscription = client.subscribe(`/topic/webrtc/offer/${numericRoomId}`, (message) => {
        try {
          const payload = JSON.parse(message.body);
          handleIncomingOffer(payload);
        } catch (err) {
          console.error("Error parsing WebRTC offer:", err);
        }
      });

      webrtcAnswerSubscription = client.subscribe(`/topic/webrtc/answer/${numericRoomId}`, (message) => {
        try {
          const payload = JSON.parse(message.body);
          handleIncomingAnswer(payload);
        } catch (err) {
          console.error("Error parsing WebRTC answer:", err);
        }
      });

      webrtcIceSubscription = client.subscribe(`/topic/webrtc/ice/${numericRoomId}`, (message) => {
        try {
          const payload = JSON.parse(message.body);
          handleIncomingIceCandidate(payload);
        } catch (err) {
          console.error("Error parsing WebRTC ICE candidate:", err);
        }
      });

      client.publish({
        destination: `/app/participants/${numericRoomId}`,
        body: JSON.stringify({
          userId: localUserId,
          username: localUserId
        })
      });
    };

    const onError = () => {
      setStatus("Connection error");
    };

    const client = createStompClient(onConnect, onError);
    stompClientRef.current = client;
    setStompClient(client);

    return () => {
      if (notesSubscription) {
        notesSubscription.unsubscribe();
      }
      if (cursorSubscription) {
        cursorSubscription.unsubscribe();
      }
      if (doubtSubscription) {
        doubtSubscription.unsubscribe();
      }
      if (participantsSubscription) {
        participantsSubscription.unsubscribe();
      }
      if (chatSubscription) {
        chatSubscription.unsubscribe();
      }
      if (webrtcOfferSubscription) {
        webrtcOfferSubscription.unsubscribe();
      }
      if (webrtcAnswerSubscription) {
        webrtcAnswerSubscription.unsubscribe();
      }
      if (webrtcIceSubscription) {
        webrtcIceSubscription.unsubscribe();
      }
      if (client) {
        client.deactivate();
      }
      stompClientRef.current = null;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      doubtTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      doubtTimeoutsRef.current.clear();
      handleEndCall();
    };
  }, [numericRoomId, localUserId, handleIncomingOffer, handleIncomingAnswer, handleIncomingIceCandidate, handleEndCall]);

  const sendNoteUpdate = useCallback(
    (content) => {
      if (!stompClient || !stompClient.connected) {
        return;
      }

      isLocalUpdateRef.current = true;
      stompClient.publish({
        destination: `/app/notes/${numericRoomId}`,
        body: JSON.stringify({
          content: content
        })
      });
    },
    [stompClient, numericRoomId]
  );

  const handleSharedChange = useCallback(
    (value) => {
      setSharedNote(value);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        sendNoteUpdate(value);
      }, 300);
    },
    [sendNoteUpdate]
  );

  const handleSharedSave = async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    try {
      await NoteApi.updateShared(numericRoomId, sharedNote);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrivateSave = async (value) => {
    setPrivateNote(value);
    try {
      await NoteApi.savePrivate(numericRoomId, value);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStudyAreaMouseMove = (e) => {
    if (!stompClient || !stompClient.connected || !studyAreaRef.current) {
      return;
    }

    const now = Date.now();
    if (now - lastCursorPublishRef.current < 40) {
      return;
    }
    lastCursorPublishRef.current = now;

    const rect = studyAreaRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    currentCursorRef.current = { x, y };

    stompClient.publish({
      destination: `/app/cursor/${numericRoomId}`,
      body: JSON.stringify({
        userId: localUserId,
        x,
        y,
        color: localCursorColor
      })
    });
  };

  const handleRaiseDoubt = useCallback(() => {
    if (!stompClient || !stompClient.connected) {
      return;
    }

    const { x, y } = currentCursorRef.current;
    stompClient.publish({
      destination: `/app/doubt/${numericRoomId}`,
      body: JSON.stringify({
        userId: localUserId,
        x,
        y
      })
    });
  }, [stompClient, numericRoomId, localUserId]);

  const handleSendChatMessage = useCallback(
    (text) => {
      if (!stompClient || !stompClient.connected) {
        return;
      }

      const message = text.trim();
      if (!message) {
        return;
      }

      stompClient.publish({
        destination: `/app/chat/${numericRoomId}`,
        body: JSON.stringify({
          sender: localUserId,
          message,
          timestamp: Date.now()
        })
      });
    },
    [stompClient, numericRoomId, localUserId]
  );

  const handleUploadClick = () => {
    materialFileInputRef.current?.click();
  };

  const handleMaterialSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setMaterialStatus("Uploading...");
      await MaterialApi.upload(numericRoomId, file);
      await fetchMaterials();
      setViewMode("material");
      setMaterialStatus("Upload successful.");
    } catch (err) {
      console.error("Failed to upload material:", err);
      const serverMessage = err?.response?.data?.message || err?.response?.data?.error;
      setMaterialStatus(serverMessage || "Upload failed. Please check file size/type and try again.");
    } finally {
      e.target.value = "";
    }
  };

  const handleMaterialDownload = useCallback(async (materialItem) => {
    if (!materialItem?.id) {
      return;
    }

    try {
      const response = await MaterialApi.getFileById(materialItem.id);
      const blob = response.data;
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = materialItem.fileName || "study-material";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      try {
        // Fallback for backend versions without /file/id/{materialId}
        const fallbackResponse = await MaterialApi.getLatestFile(numericRoomId);
        const fallbackBlobUrl = URL.createObjectURL(fallbackResponse.data);
        const link = document.createElement("a");
        link.href = fallbackBlobUrl;
        link.download = materialItem.fileName || "study-material";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(fallbackBlobUrl);
        setMaterialStatus("Downloaded latest file using compatibility mode.");
      } catch (fallbackErr) {
        console.error("Failed to download material:", err, fallbackErr);
        setMaterialStatus("Download failed. Please try again.");
      }
    }
  }, [numericRoomId]);

  const handleMaterialDelete = useCallback(
    async (materialItem) => {
      if (!materialItem?.id) {
        return;
      }

      const shouldDelete = window.confirm(`Delete "${materialItem.fileName}"?`);
      if (!shouldDelete) {
        return;
      }

      try {
        await MaterialApi.deleteById(numericRoomId, materialItem.id);
        setMaterialStatus("File deleted successfully.");
        await fetchMaterials();
      } catch (err) {
        console.error("Failed to delete material:", err);
        const serverMessage = err?.response?.data?.message || err?.response?.data?.error;
        setMaterialStatus(serverMessage || "Delete failed. Please try again.");
      }
    },
    [numericRoomId, fetchMaterials]
  );

  const canDeleteMaterial = useCallback(
    (materialItem) => {
      if (!materialItem) {
        return false;
      }
      if (materialItem.canDelete === true) {
        return true;
      }
      if (isTeacher) {
        return true;
      }
      return Boolean(
        materialItem.uploadedByUsername &&
        localUserId &&
        materialItem.uploadedByUsername === localUserId
      );
    },
    [isTeacher, localUserId]
  );

  useEffect(() => {
    let nextBlobUrl = null;
    let isCancelled = false;

    const loadMaterialBlob = async () => {
      if (!selectedMaterial) {
        setMaterialBlobUrl("");
        return;
      }

      try {
        let res;
        try {
          res = await MaterialApi.getFileById(selectedMaterial.id);
        } catch {
          // Fallback for backend versions without /file/id/{materialId}
          res = await MaterialApi.getLatestFile(numericRoomId);
        }
        if (isCancelled) {
          return;
        }

        nextBlobUrl = URL.createObjectURL(res.data);
        setMaterialBlobUrl(nextBlobUrl);
      } catch {
        if (!isCancelled) {
          setMaterialBlobUrl("");
        }
      }
    };

    loadMaterialBlob();

    return () => {
      isCancelled = true;
      if (nextBlobUrl) {
        URL.revokeObjectURL(nextBlobUrl);
      }
    };
  }, [selectedMaterial?.id, numericRoomId]);

  const materialUrl = useMemo(() => {
    if (materialBlobUrl) {
      return materialBlobUrl;
    }
    if (!selectedMaterial?.filePath) {
      return "";
    }
    if (String(selectedMaterial.filePath).startsWith("http")) {
      return selectedMaterial.filePath;
    }
    return `${apiHost}${selectedMaterial.filePath}`;
  }, [materialBlobUrl, selectedMaterial, apiHost]);

  const isPdfMaterial = useMemo(() => {
    if (!selectedMaterial) {
      return false;
    }
    const type = String(selectedMaterial.fileType || "").toLowerCase();
    const name = String(selectedMaterial.fileName || "").toLowerCase();
    return type.includes("pdf") || name.endsWith(".pdf");
  }, [selectedMaterial]);

  return (
    <div className="page-shell room-page">
      <header className="top-bar">
        <div className="top-bar-left">
          <button className="ghost-btn" onClick={() => navigate("/dashboard")}>
            {"< Back"}
          </button>
          <span className="top-bar-title">StudySync</span>
          <span className="top-bar-subtitle">Room #{numericRoomId}</span>
        </div>
        <div className="top-bar-right">
          <span className="connection-status">{status}</span>
          {user && (
            <span className="user-pill">
              {user.username} <span className="user-role">({user.role})</span>
            </span>
          )}
          <button className="ghost-btn" onClick={() => navigate("/login") || logout()}>
            Logout
          </button>
        </div>
      </header>

      <main className="room-layout-new">
        {/* Top: Shared Study Material / Whiteboard */}
        <section className="room-top">
          <div className="room-top-header">
            <div className="room-top-toggle">
              <button
                type="button"
                className={`room-toggle-btn ${viewMode === "workspace" ? "active" : ""}`}
                onClick={() => setViewMode("workspace")}
              >
                Notes + Whiteboard
              </button>
              <button
                type="button"
                className={`room-toggle-btn ${viewMode === "material" ? "active" : ""}`}
                onClick={() => setViewMode("material")}
              >
                Study Material
              </button>
            </div>
            {viewMode === "workspace" && (
              <button className="secondary-btn" onClick={handleSharedSave}>
                Save
              </button>
            )}
            {viewMode === "material" && isTeacher && (
              <>
                <input
                  ref={materialFileInputRef}
                  type="file"
                  accept=".pdf,.ppt,.pptx"
                  onChange={handleMaterialSelect}
                  style={{ display: "none" }}
                />
                <button className="secondary-btn" onClick={handleUploadClick}>
                  Upload
                </button>
              </>
            )}
          </div>
          <div
            className="room-top-content"
            ref={studyAreaRef}
            onMouseMove={handleStudyAreaMouseMove}
          >
            {viewMode === "material" ? (
              <div className="study-material-view">
                <aside className="study-material-list">
                  <h4 className="sidebar-panel-title">Uploaded Files</h4>
                  {materials.length > 0 ? (
                    <div className="study-material-list-items">
                      {materials.map((item) => (
                        <div
                          key={item.id}
                          className={`study-material-list-item ${item.id === selectedMaterialId ? "active" : ""}`}
                        >
                          <button
                            type="button"
                            className="study-material-file-btn"
                            onClick={() => setSelectedMaterialId(item.id)}
                          >
                            {item.fileName}
                          </button>
                          <div className="study-material-actions">
                            <button
                              type="button"
                              className="secondary-btn"
                              onClick={() => setSelectedMaterialId(item.id)}
                            >
                              Preview
                            </button>
                            <button
                              type="button"
                              className="ghost-btn"
                              onClick={() => handleMaterialDownload(item)}
                            >
                              Download
                            </button>
                            {canDeleteMaterial(item) && (
                              <button
                                type="button"
                                className="danger-btn"
                                onClick={() => handleMaterialDelete(item)}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted-text study-material-empty">No study material uploaded yet.</p>
                  )}
                </aside>
                <div className="study-material-preview">
                  {selectedMaterial ? (
                    isPdfMaterial ? (
                      <iframe
                        title="Study Material PDF"
                        src={materialUrl}
                        className="study-material-frame"
                      />
                    ) : (
                      <div className="study-material-link-wrap">
                        <p className="muted-text">Preview not available for this file type.</p>
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => handleMaterialDownload(selectedMaterial)}
                        >
                          Download {selectedMaterial.fileName}
                        </button>
                      </div>
                    )
                  ) : (
                    <p className="muted-text study-material-empty">
                      Select a file to preview.
                    </p>
                  )}
                </div>
                {materialStatus && (
                  <p className="material-status-text">{materialStatus}</p>
                )}
              </div>
            ) : (
              <div className="room-workspace-split">
                <div className="room-shared-notes-pane">
                  <div className="shared-notes-container">
                    <SharedNotesEditor value={sharedNote} onChange={handleSharedChange} />
                  </div>
                </div>
                <div className="room-whiteboard-pane">
                  <WhiteboardCanvas
                    roomId={numericRoomId}
                    client={stompClient}
                    isConnected={isWsConnected}
                    inline={true}
                  />
                </div>
              </div>
            )}
            <div
              className="cursor-overlay"
              style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 20 }}
            >
              {Object.entries(cursors).map(([cursorUserId, cursor]) => (
                <div
                  key={cursorUserId}
                  style={{
                    position: "absolute",
                    left: `${cursor.x}%`,
                    top: `${cursor.y}%`,
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: cursor.color,
                    pointerEvents: "none",
                    transform: "translate(-50%, -50%)"
                  }}
                />
              ))}
              {doubts.map((doubt) => (
                <div
                  key={doubt.id}
                  className="doubt-marker"
                  style={{
                    left: `${doubt.x}%`,
                    top: `${doubt.y}%`
                  }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Bottom: Private Notes | Tools Sidebar */}
        <section className="room-bottom">
          <div className="room-private-notes">
            <h3 className="room-panel-title">Private Notes</h3>
            <PrivateNotesPanel value={privateNote} onSave={handlePrivateSave} />
          </div>
          <div className="room-tools-wrapper">
            <ToolsSidebar
              roomId={numericRoomId}
              sharedContent={sharedNote}
              client={stompClient}
              activeTool={activeTool}
              onToolChange={setActiveTool}
              onRaiseDoubt={handleRaiseDoubt}
              participants={participants}
              messages={messages}
              onSendChatMessage={handleSendChatMessage}
              isCalling={isCalling}
              isMuted={isMuted}
              hasLocalStream={Boolean(localStream)}
              hasPeerConnection={Boolean(peerConnection)}
              onStartCall={handleStartCall}
              onEndCall={handleEndCall}
              onToggleMute={handleToggleMute}
            />
          </div>
        </section>
      </main>
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />
    </div>
  );
}

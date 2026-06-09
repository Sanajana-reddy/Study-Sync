import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { RoomApi } from "../services/api";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [actionError, setActionError] = useState("");

  const loadRooms = async () => {
    setLoadingRooms(true);
    try {
      const { data } = await RoomApi.getMyRooms();
      setRooms(data || []);
    } catch (err) {
      // leave a subtle error; not fatal
      console.error(err);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setActionError("");
    try {
      const { data } = await RoomApi.createRoom(createName.trim());
      setCreateName("");
      await loadRooms();
      navigate(`/rooms/${data.id}`);
    } catch (err) {
      const msg = err?.response?.data?.message || "Could not create room.";
      setActionError(msg);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setActionError("");
    try {
      const { data } = await RoomApi.joinRoom(joinCode.trim());
      setJoinCode("");
      await loadRooms();
      navigate(`/rooms/${data.id}`);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Could not join room.";
      setActionError(msg);
    }
  };

  return (
    <div className="page-shell dashboard-page">
      <header className="top-bar">
        <div className="top-bar-left">
          <span className="top-bar-title">StudySync</span>
          <span className="top-bar-subtitle">Dashboard</span>
        </div>
        <div className="top-bar-right">
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

      <main className="dashboard-main">
        <section className="panel-grid">
          <div className="panel">
            <h3>Create room</h3>
            <form onSubmit={handleCreateRoom} className="stacked-form">
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Room name e.g. CS101 Lab"
                className="form-input"
              />
              <button type="submit" className="primary-btn">
                Create
              </button>
            </form>
          </div>

          <div className="panel">
            <h3>Join room</h3>
            <form onSubmit={handleJoinRoom} className="stacked-form">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                className="form-input"
              />
              <button type="submit" className="secondary-btn">
                Join
              </button>
            </form>
          </div>
        </section>
        <section className="panel panel-wide">
          <h2>Rooms</h2>
          {loadingRooms ? (
            <p className="muted-text">Loading rooms...</p>
          ) : rooms.length === 0 ? (
            <p className="muted-text">You are not part of any rooms yet.</p>
          ) : (
            <ul className="room-list">
              {rooms.map((room) => (
                <li
                  key={room.id}
                  className="room-item"
                  onClick={() => navigate(`/rooms/${room.id}`)}
                >
                  <div>
                    <div className="room-name">{room.name}</div>
                    <div className="room-meta">
                      Code: <span className="mono">{room.code}</span> | Owner:{" "}
                      <span className="mono">{room.ownerUsername}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      navigate(`/rooms/${room.id}`);
                    }}
                  >
                    Open
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        

        {actionError && <div className="form-error dashboard-error">{actionError}</div>}
      </main>
    </div>
  );
}


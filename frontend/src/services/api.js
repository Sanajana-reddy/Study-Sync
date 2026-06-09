import axios from "axios";

export const API_BASE_URL = "http://localhost:18095/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData && config.headers) {
    if (typeof config.headers.delete === "function") {
      config.headers.delete("Content-Type");
    } else {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
  }

  const token = localStorage.getItem("studysync_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || "");
    const isAuthRequest = requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register");

    if (status === 401 && !isAuthRequest) {
      localStorage.removeItem("studysync_token");
      localStorage.removeItem("studysync_user");

      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// Convenience helpers
export const AuthApi = {
  login: (username, password) => api.post("/auth/login", { username, password }),
  register: (payload) => api.post("/auth/register", payload)
};

export const RoomApi = {
  getMyRooms: () => api.get("/rooms/my-rooms"),
  createRoom: (name) => api.post("/rooms", { name }),
  joinRoom: (code) => api.post("/rooms/join", { code }),
  getByCode: (code) => api.get(`/rooms/code/${code}`)
};

export const NoteApi = {
  savePrivate: (roomId, content) => api.post("/notes/private", { roomId, content }),
  getPrivate: (roomId) => api.get(`/notes/private/${roomId}`),
  getShared: (roomId) => api.get(`/notes/shared/${roomId}`),
  updateShared: (roomId, content) => api.put("/notes/shared", { roomId, content })
};

export const SessionApi = {
  start: (roomId) => api.post(`/sessions/start/${roomId}`),
  archive: (sessionId, summary) => api.post("/sessions/archive", { sessionId, summary }),
  listByRoom: (roomId) => api.get(`/sessions/room/${roomId}`)
};

export const MaterialApi = {
  upload: (roomId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    // Let the browser set multipart boundary automatically.
    return api.post(`/material/upload/${roomId}`, formData);
  },
  list: (roomId) => api.get(`/material/list/${roomId}`),
  getLatest: (roomId) => api.get(`/material/${roomId}`),
  getLatestFile: (roomId) =>
    api.get(`/material/file/${roomId}`, {
      responseType: "blob"
    }),
  getFileById: (materialId) =>
    api.get(`/material/file/id/${materialId}`, {
      responseType: "blob"
    }),
  deleteById: (roomId, materialId) => api.delete(`/material/${roomId}/${materialId}`)
};

export const AiApi = {
  generate: (roomId, type, content) =>
    api.post(`/ai/generate/${roomId}`, {
      type,
      content
    }),
  getByRoom: (roomId) => api.get(`/ai/${roomId}`)
};


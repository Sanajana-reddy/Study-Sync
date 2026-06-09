import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register, isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const [mode, setMode] = useState("login"); // login | register
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "STUDENT"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const username = form.username.trim();
      if (mode === "login") {
        await login(username, form.password);
      } else {
        await register({
          username,
          email: form.email.trim(),
          password: form.password,
          role: form.role
        });
      }
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-card">
          <h2 className="app-title">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="app-subtitle">
            {mode === "login"
              ? "Continue your study sessions."
              : "Start collaborating with your class."}
          </p>

          <div className="auth-toggle">
            <button
              type="button"
              className={mode === "login" ? "auth-toggle-btn active" : "auth-toggle-btn"}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={mode === "register" ? "auth-toggle-btn active" : "auth-toggle-btn"}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="form-label">
              Username
              <input
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                required
                className="form-input"
              />
            </label>

            {mode === "register" && (
              <label className="form-label">
                Email
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </label>
            )}

            <label className="form-label">
              Password
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                required
                className="form-input"
              />
            </label>
            <label className="show-password-control">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              Show password
            </label>

            {mode === "register" && (
              <label className="form-label">
                Role
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                </select>
              </label>
            )}

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


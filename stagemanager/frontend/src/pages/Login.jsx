import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { errText } from "../api.js";

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ username: "", password: "" });
  const [err, setErr] = useState("");
  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await login(f.username, f.password);
      nav("/");
    } catch (e) {
      setErr(e.response?.status === 401 ? "Неверный логин или пароль." : errText(e));
    }
  };

  return (
    <div className="login">
      <form onSubmit={submit} className="login-box">
        <h1>StageManager</h1>
        <p className="muted">Учёт оборудования, мероприятия и технические райдеры</p>
        <label>Логин<input autoFocus value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></label>
        <label>Пароль<input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        {err && <p className="error">{err}</p>}
        <button className="btn primary">Войти</button>
      </form>
    </div>
  );
}

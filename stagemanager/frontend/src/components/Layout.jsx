import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { ROLES } from "../api.js";

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const nav = useNavigate();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">StageManager</div>
        <nav>
          <NavLink to="/" end>Обзор</NavLink>
          <NavLink to="/equipment">Оборудование</NavLink>
          <NavLink to="/events">Мероприятия</NavLink>
          {isAdmin && <NavLink to="/users">Пользователи</NavLink>}
        </nav>
        <div className="me">
          <strong>{user.first_name || user.username}</strong>
          <span>{ROLES[user.role]}</span>
          <button className="link" onClick={() => { logout(); nav("/login"); }}>Выйти</button>
        </div>
      </aside>
      <main className="content"><Outlet /></main>
    </div>
  );
}

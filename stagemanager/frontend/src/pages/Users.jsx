import { useEffect, useState } from "react";
import api, { errText, ROLES } from "../api.js";
import { useAuth } from "../auth.jsx";
import Modal from "../components/Modal.jsx";

const EMPTY = { username: "", first_name: "", last_name: "", email: "", role: "technician", is_active: true, password: "" };

export default function Users() {
  const { user: me } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState("");
  const load = () => api.get("/users/").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setErr("");
    const body = { ...form };
    if (!body.password) delete body.password;
    try {
      if (form.id) await api.patch(`/users/${form.id}/`, body);
      else await api.post("/users/", body);
      setForm(null); load();
    } catch (e) { setErr(errText(e)); }
  };
  const remove = async (u) => {
    if (!confirm(`Удалить пользователя ${u.username}?`)) return;
    try { await api.delete(`/users/${u.id}/`); load(); } catch (e) { alert(errText(e)); }
  };

  return (
    <>
      <div className="page-head">
        <h1>Пользователи</h1>
        <button className="btn primary" onClick={() => { setErr(""); setForm(EMPTY); }}>Добавить пользователя</button>
      </div>
      <table>
        <thead><tr><th>Логин</th><th>Имя</th><th>Роль</th><th>Доступ</th><th></th></tr></thead>
        <tbody>
          {items.map((u) => (
            <tr key={u.id}>
              <td><strong>{u.username}</strong><div className="muted small">{u.email}</div></td>
              <td>{[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}</td>
              <td>{ROLES[u.role]}</td>
              <td>{u.is_active ? "Активен" : <span className="bad">Отключён</span>}</td>
              <td className="actions">
                <button className="link" onClick={() => { setErr(""); setForm({ ...u, password: "" }); }}>Изменить</button>
                {u.id !== me.id && <button className="link danger" onClick={() => remove(u)}>Удалить</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="note muted small">
        <b>Администратор</b> — всё, включая пользователей. <b>Менеджер</b> — оборудование, мероприятия, брони. <b>Технарь</b> — просмотр и райдеры.
      </div>

      {form && (
        <Modal title={form.id ? "Изменить пользователя" : "Новый пользователь"} onClose={() => setForm(null)}>
          <form onSubmit={save} className="form">
            <label>Логин<input required value={form.username} onChange={set("username")} /></label>
            <div className="row">
              <label>Имя<input value={form.first_name} onChange={set("first_name")} /></label>
              <label>Фамилия<input value={form.last_name} onChange={set("last_name")} /></label>
            </div>
            <label>Email<input type="email" value={form.email} onChange={set("email")} /></label>
            <div className="row">
              <label>Роль<select value={form.role} onChange={set("role")}>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
              <label>{form.id ? "Новый пароль" : "Пароль"}<input type="password" minLength={6} required={!form.id} placeholder={form.id ? "Оставьте пустым, чтобы не менять" : ""} value={form.password} onChange={set("password")} /></label>
            </div>
            <label className="check"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Доступ разрешён</label>
            {err && <p className="error">{err}</p>}
            <div className="row end"><button type="button" className="btn" onClick={() => setForm(null)}>Отмена</button><button className="btn primary">Сохранить</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}

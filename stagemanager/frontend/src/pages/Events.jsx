import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errText, fmtRange, STATUS } from "../api.js";
import { useAuth } from "../auth.jsx";
import Modal from "../components/Modal.jsx";

export function EventForm({ initial, onSaved, onClose }) {
  const [f, setF] = useState(initial);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const { data } = f.id ? await api.put(`/events/${f.id}/`, f) : await api.post("/events/", f);
      onSaved(data);
    } catch (e) { setErr(errText(e)); }
  };
  return (
    <Modal title={f.id ? "Изменить мероприятие" : "Новое мероприятие"} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <label>Название<input required value={f.title} onChange={set("title")} /></label>
        <label>Площадка<input value={f.venue} onChange={set("venue")} /></label>
        <div className="row">
          <label>Начало<input type="date" required value={f.start_date} onChange={set("start_date")} /></label>
          <label>Окончание<input type="date" required min={f.start_date} value={f.end_date} onChange={set("end_date")} /></label>
          <label>Статус<select value={f.status} onChange={set("status")}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        </div>
        <label>Описание<textarea rows="2" value={f.description} onChange={set("description")} /></label>
        <label>Заметки для райдера<textarea rows="3" placeholder="Время загрузки, саундчек, требования к питанию…" value={f.rider_notes} onChange={set("rider_notes")} /></label>
        {err && <p className="error">{err}</p>}
        <div className="row end"><button type="button" className="btn" onClick={onClose}>Отмена</button><button className="btn primary">Сохранить</button></div>
      </form>
    </Modal>
  );
}

export const EMPTY_EVENT = { title: "", venue: "", start_date: "", end_date: "", status: "draft", description: "", rider_notes: "" };

export default function Events() {
  const { canEdit } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (q) p.set("search", q);
    p.set("ordering", "-start_date");
    const t = setTimeout(() => api.get(`/events/?${p}`).then((r) => setItems(r.data)), 200);
    return () => clearTimeout(t);
  }, [status, q]);

  return (
    <>
      <div className="page-head">
        <h1>Мероприятия</h1>
        {canEdit && <button className="btn primary" onClick={() => setCreating(true)}>Создать мероприятие</button>}
      </div>
      <div className="filters">
        <input placeholder="Поиск по названию или площадке" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Все статусы</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <table>
        <thead><tr><th>Мероприятие</th><th>Даты</th><th>Позиций</th><th>Статус</th></tr></thead>
        <tbody>
          {items.map((e) => (
            <tr key={e.id}>
              <td><Link to={`/events/${e.id}`}><strong>{e.title}</strong></Link><div className="muted small">{e.venue}</div></td>
              <td>{fmtRange(e.start_date, e.end_date)}</td>
              <td>{e.bookings_count}</td>
              <td><span className={`badge ${e.status}`}>{STATUS[e.status]}</span></td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={4} className="muted">Мероприятий не найдено.</td></tr>}
        </tbody>
      </table>
      {creating && <EventForm initial={EMPTY_EVENT} onClose={() => setCreating(false)} onSaved={(e) => nav(`/events/${e.id}`)} />}
    </>
  );
}

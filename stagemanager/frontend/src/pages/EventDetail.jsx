import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { errText, fmtRange, KINDS, STATUS } from "../api.js";
import { useAuth } from "../auth.jsx";
import { EventForm } from "./Events.jsx";

export default function EventDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { canEdit } = useAuth();
  const [ev, setEv] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [pick, setPick] = useState({ equipment: "", quantity: 1 });
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState("");

  const loadBookings = useCallback(() => api.get(`/bookings/?event=${id}`).then((r) => setBookings(r.data)), [id]);
  const loadEvent = useCallback(() => api.get(`/events/${id}/`).then((r) => setEv(r.data)), [id]);

  useEffect(() => { loadEvent(); loadBookings(); }, [loadEvent, loadBookings]);

  // Доступность считается на даты мероприятия, без учёта его собственных броней.
  const loadAvailability = useCallback(() => {
    if (!ev) return;
    api.get(`/equipment/?date_from=${ev.start_date}&date_to=${ev.end_date}&exclude_event=${ev.id}`).then((r) => setEquipment(r.data));
  }, [ev]);
  useEffect(loadAvailability, [loadAvailability, bookings]);

  if (!ev) return <p className="muted">Загрузка…</p>;
  const locked = ev.status === "cancelled" || ev.status === "completed";
  const used = new Set(bookings.map((b) => b.equipment));
  const options = equipment.filter((e) => !used.has(e.id));

  const add = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await api.post("/bookings/", { event: ev.id, equipment: Number(pick.equipment), quantity: Number(pick.quantity) });
      setPick({ equipment: "", quantity: 1 });
      loadBookings(); loadEvent();
    } catch (e) { setErr(errText(e)); }
  };
  const changeQty = async (b, quantity) => {
    setErr("");
    try { await api.patch(`/bookings/${b.id}/`, { quantity }); loadBookings(); } catch (e) { setErr(errText(e)); loadBookings(); }
  };
  const removeBooking = async (b) => { await api.delete(`/bookings/${b.id}/`); loadBookings(); loadEvent(); };
  const removeEvent = async () => {
    if (!confirm(`Удалить мероприятие «${ev.title}» вместе с бронями?`)) return;
    await api.delete(`/events/${ev.id}/`);
    nav("/events");
  };
  const selected = equipment.find((e) => e.id === Number(pick.equipment));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{ev.title}</h1>
          <p className="muted">{fmtRange(ev.start_date, ev.end_date)}{ev.venue ? ` · ${ev.venue}` : ""} <span className={`badge ${ev.status}`}>{STATUS[ev.status]}</span></p>
        </div>
        <div className="row">
          <Link className="btn" to={`/events/${ev.id}/rider`}>Технический райдер</Link>
          {canEdit && <button className="btn" onClick={() => setEditing(true)}>Изменить</button>}
          {canEdit && <button className="btn danger" onClick={removeEvent}>Удалить</button>}
        </div>
      </div>
      {ev.description && <p>{ev.description}</p>}

      <h2>Забронированное оборудование</h2>
      {err && <p className="error">{err}</p>}
      <table>
        <thead><tr><th>Позиция</th><th>Категория</th><th>Количество</th>{canEdit && <th></th>}</tr></thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td><strong>{b.equipment_name}</strong><div className="muted small">{[b.manufacturer, b.model].filter(Boolean).join(" ")}</div></td>
              <td>{b.category_name}<div className="muted small">{KINDS[b.kind]}</div></td>
              <td>{canEdit && !locked
                ? <input className="qty" type="number" min="1" defaultValue={b.quantity} key={b.quantity}
                    onBlur={(e) => Number(e.target.value) !== b.quantity && changeQty(b, Number(e.target.value))} />
                : b.quantity}</td>
              {canEdit && <td className="actions">{!locked && <button className="link danger" onClick={() => removeBooking(b)}>Убрать</button>}</td>}
            </tr>
          ))}
          {bookings.length === 0 && <tr><td colSpan={4} className="muted">Оборудование ещё не добавлено.</td></tr>}
        </tbody>
      </table>

      {canEdit && !locked && (
        <form className="add-bar" onSubmit={add}>
          <select required value={pick.equipment} onChange={(e) => setPick({ ...pick, equipment: e.target.value })}>
            <option value="">Выберите оборудование</option>
            {options.map((e) => <option key={e.id} value={e.id} disabled={e.available === 0}>{e.name} — свободно {e.available}</option>)}
          </select>
          <input type="number" min="1" max={selected?.available || undefined} value={pick.quantity} onChange={(e) => setPick({ ...pick, quantity: e.target.value })} aria-label="Количество" />
          <button className="btn primary">Забронировать</button>
        </form>
      )}

      {editing && <EventForm initial={ev} onClose={() => setEditing(false)} onSaved={(e) => { setEv(e); setEditing(false); loadAvailability(); }} />}
    </>
  );
}

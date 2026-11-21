import { useCallback, useEffect, useState } from "react";
import api, { errText, KINDS } from "../api.js";
import { useAuth } from "../auth.jsx";
import Modal from "../components/Modal.jsx";
import Fader from "../components/Fader.jsx";

const EMPTY = { name: "", category: "", manufacturer: "", model: "", description: "", total_quantity: 1, in_repair_quantity: 0 };

export default function Equipment() {
  const { canEdit } = useAuth();
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [form, setForm] = useState(null);
  const [newCat, setNewCat] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    const p = new URLSearchParams();
    if (q) p.set("search", q);
    if (kind) p.set("kind", kind);
    if (from) { p.set("date_from", from); p.set("date_to", to || from); }
    api.get(`/equipment/?${p}`).then((r) => setItems(r.data));
  }, [q, kind, from, to]);

  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);
  useEffect(() => { api.get("/categories/").then((r) => setCats(r.data)); }, []);

  const save = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      let category = form.category;
      if (newCat) {
        const { data } = await api.post("/categories/", newCat);
        category = data.id;
        setCats((c) => [...c, data]);
      }
      const body = { ...form, category };
      if (form.id) await api.put(`/equipment/${form.id}/`, body);
      else await api.post("/equipment/", body);
      setForm(null); setNewCat(null); load();
    } catch (e) { setErr(errText(e)); }
  };

  const remove = async (it) => {
    if (!confirm(`Удалить «${it.name}»?`)) return;
    try { await api.delete(`/equipment/${it.id}/`); load(); } catch (e) { alert(errText(e)); }
  };

  const open = (it) => { setErr(""); setNewCat(null); setForm(it || { ...EMPTY, category: cats[0]?.id || "" }); };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <div className="page-head">
        <h1>Оборудование</h1>
        {canEdit && <button className="btn primary" onClick={() => open()}>Добавить оборудование</button>}
      </div>

      <div className="filters">
        <input placeholder="Поиск по названию, модели, категории" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">Весь свет и звук</option>
          {Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label className="inline">Свободно с<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="inline">по<input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></label>
        {from && <button className="link" onClick={() => { setFrom(""); setTo(""); }}>Сбросить даты</button>}
      </div>

      <table>
        <thead><tr><th>Название</th><th>Категория</th><th className="w-fader">{from ? "Доступность на даты" : "Наличие"}</th>{canEdit && <th></th>}</tr></thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td><strong>{it.name}</strong><div className="muted small">{[it.manufacturer, it.model].filter(Boolean).join(" ")}</div></td>
              <td>{it.category_name}<div className="muted small">{it.kind_label}</div></td>
              <td><Fader total={it.total_quantity} repair={it.in_repair_quantity} booked={it.booked} /></td>
              {canEdit && <td className="actions"><button className="link" onClick={() => open(it)}>Изменить</button><button className="link danger" onClick={() => remove(it)}>Удалить</button></td>}
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={4} className="muted">Ничего не найдено.</td></tr>}
        </tbody>
      </table>
      {from && <p className="legend muted small"><i className="dot free" /> свободно <i className="dot booked" /> занято мероприятиями <i className="dot repair" /> в ремонте</p>}

      {form && (
        <Modal title={form.id ? "Изменить оборудование" : "Новое оборудование"} onClose={() => setForm(null)}>
          <form onSubmit={save} className="form">
            <label>Название<input required value={form.name} onChange={set("name")} /></label>
            <label>Категория
              {newCat ? (
                <div className="row">
                  <input required placeholder="Название категории" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} />
                  <select value={newCat.kind} onChange={(e) => setNewCat({ ...newCat, kind: e.target.value })}>
                    {Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <button type="button" className="link" onClick={() => setNewCat(null)}>Отмена</button>
                </div>
              ) : (
                <div className="row">
                  <select required value={form.category} onChange={set("category")}>
                    {cats.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.kind_label})</option>)}
                  </select>
                  <button type="button" className="link" onClick={() => setNewCat({ name: "", kind: "light" })}>Новая категория</button>
                </div>
              )}
            </label>
            <div className="row">
              <label>Производитель<input value={form.manufacturer} onChange={set("manufacturer")} /></label>
              <label>Модель<input value={form.model} onChange={set("model")} /></label>
            </div>
            <div className="row">
              <label>Всего, шт.<input type="number" min="0" required value={form.total_quantity} onChange={set("total_quantity")} /></label>
              <label>В ремонте, шт.<input type="number" min="0" required value={form.in_repair_quantity} onChange={set("in_repair_quantity")} /></label>
            </div>
            <label>Описание<textarea rows="3" value={form.description} onChange={set("description")} /></label>
            {err && <p className="error">{err}</p>}
            <div className="row end"><button type="button" className="btn" onClick={() => setForm(null)}>Отмена</button><button className="btn primary">Сохранить</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}

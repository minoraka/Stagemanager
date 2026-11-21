import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { fmtRange, STATUS } from "../api.js";

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [repair, setRepair] = useState([]);
  useEffect(() => {
    api.get("/stats/").then((r) => setS(r.data));
    api.get("/equipment/?in_repair=1").then((r) => setRepair(r.data));
  }, []);
  if (!s) return <p className="muted">Загрузка…</p>;

  return (
    <>
      <div className="page-head"><h1>Обзор</h1></div>
      <div className="stats">
        <div><b>{s.positions}</b><span>позиций в каталоге</span></div>
        <div><b>{s.units_total}</b><span>единиц оборудования</span></div>
        <div><b className={s.units_in_repair ? "bad" : ""}>{s.units_in_repair}</b><span>в ремонте</span></div>
        <div><b>{s.events_next_30_days}</b><span>мероприятий на 30 дней</span></div>
      </div>

      <div className="two-col">
        <section>
          <h2>Ближайшие мероприятия</h2>
          {s.upcoming.length === 0 && <p className="muted">Мероприятий пока нет. Создайте первое в разделе «Мероприятия».</p>}
          <ul className="plain">
            {s.upcoming.map((e) => (
              <li key={e.id}>
                <Link to={`/events/${e.id}`}>{e.title}</Link>
                <span className="muted">{fmtRange(e.start_date, e.end_date)}{e.venue ? `, ${e.venue}` : ""}</span>
                <span className={`badge ${e.status}`}>{STATUS[e.status]}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2>В ремонте</h2>
          {repair.length === 0 && <p className="muted">Вся техника исправна.</p>}
          <ul className="plain">
            {repair.map((e) => (
              <li key={e.id}><span>{e.name}</span><span className="bad">{e.in_repair_quantity} из {e.total_quantity}</span></li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

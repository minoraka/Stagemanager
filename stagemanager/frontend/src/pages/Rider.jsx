import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { fmtRange, STATUS } from "../api.js";

export default function Rider() {
  const { id } = useParams();
  const [r, setR] = useState(null);
  useEffect(() => { api.get(`/events/${id}/rider/`).then((x) => setR(x.data)); }, [id]);
  if (!r) return <p className="muted">Загрузка…</p>;
  const e = r.event;

  return (
    <>
      <div className="page-head no-print">
        <Link to={`/events/${id}`}>← К мероприятию</Link>
        <button className="btn primary" onClick={() => window.print()}>Печать</button>
      </div>
      <article className="rider">
        <header>
          <p className="muted">Технический райдер</p>
          <h1>{e.title}</h1>
          <dl>
            <dt>Даты</dt><dd>{fmtRange(e.start_date, e.end_date)}</dd>
            {e.venue && <><dt>Площадка</dt><dd>{e.venue}</dd></>}
            <dt>Статус</dt><dd>{STATUS[e.status]}</dd>
          </dl>
        </header>

        {r.sections.length === 0 && <p className="muted">В райдере пока нет оборудования.</p>}
        {r.sections.map((s) => (
          <section key={s.kind}>
            <h2>{s.label}</h2>
            <table>
              <thead><tr><th>Позиция</th><th>Производитель, модель</th><th className="num">Кол-во</th></tr></thead>
              <tbody>
                {s.items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.name}{i.note && <div className="muted small">{i.note}</div>}</td>
                    <td>{[i.manufacturer, i.model].filter(Boolean).join(" ") || "—"}</td>
                    <td className="num">{i.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
        {r.sections.length > 0 && <p className="total">Всего единиц: <b>{r.total_units}</b></p>}
        {e.rider_notes && <section><h2>Заметки</h2><p className="pre">{e.rider_notes}</p></section>}
      </article>
    </>
  );
}

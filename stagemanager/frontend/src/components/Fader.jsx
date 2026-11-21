/** Шкала количества: занято / в ремонте / свободно — как индикатор уровня на пульте. */
export default function Fader({ total, repair, booked }) {
  const known = booked !== null && booked !== undefined;
  const b = known ? Math.min(booked, Math.max(total - repair, 0)) : 0;
  const free = Math.max(total - repair - b, 0);
  const pct = (n) => (total ? (n / total) * 100 : 0) + "%";
  return (
    <div className="fader-wrap">
      <div className="fader" role="img"
        aria-label={`Всего ${total}, в ремонте ${repair}${known ? `, занято ${b}` : ""}, свободно ${free}`}>
        <span className="seg free" style={{ width: pct(free) }} />
        {known && <span className="seg booked" style={{ width: pct(b) }} />}
        <span className="seg repair" style={{ width: pct(repair) }} />
      </div>
      <div className="fader-text">
        {known ? <><b>{free}</b> свободно из {total}</> : <><b>{total - repair}</b> исправно из {total}</>}
        {repair > 0 && <span className="bad"> · {repair} в ремонте</span>}
      </div>
    </div>
  );
}

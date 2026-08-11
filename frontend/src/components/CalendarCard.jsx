import { useMemo, useState } from "react";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad2(value) {
  return String(value).padStart(2, "0");
}

function toKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
}

function CalendarCard({
  title = "Login Progress",
  subtitle = "Track your daily coding consistency",
  loggedInDates = [],
  initialDate,
  className = "",
}) {
  const initial = initialDate ? new Date(initialDate) : new Date();
  const [viewDate, setViewDate] = useState(
    new Date(initial.getFullYear(), initial.getMonth(), 1)
  );

  const loggedSet = useMemo(() => new Set(loggedInDates), [loggedInDates]);

  const year = viewDate.getFullYear();
  const monthIndex = viewDate.getMonth();
  const monthLabel = `${MONTHS[monthIndex]} ${year}`;

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startDay = new Date(year, monthIndex, 1).getDay();

  const handlePrev = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNext = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const dayCells = [];
  for (let i = 0; i < startDay; i += 1) {
    dayCells.push({ type: "empty", key: `e-${i}` });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateObj = new Date(year, monthIndex, day);
    const key = toKey(dateObj);
    const isLogged = loggedSet.has(key);
    dayCells.push({
      type: "day",
      day,
      key,
      logged: isLogged,
    });
  }

  return (
    <div className={`calendar-section card calendar-compact ${className}`.trim()}>
      <div className="calendar-title-row">
        <div>
          <h2>{title}</h2>
          <p className="calendar-subtitle">{subtitle}</p>
        </div>
        <div className="calendar-header">
          <button className="calendar-nav-btn" onClick={handlePrev}>
            {"<"}
          </button>
          <span>{monthLabel}</span>
          <button className="calendar-nav-btn" onClick={handleNext}>
            {">"}
          </button>
        </div>
      </div>

      <div className="calendar-weekdays">
        {WEEKDAYS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="calendar-grid">
        {dayCells.map((cell) => {
          if (cell.type === "empty") {
            return <span key={cell.key} className="calendar-day empty" />;
          }

          return (
            <span
              key={cell.key}
              className={`calendar-day ${cell.logged ? "logged" : "missed"}`}
            >
              {cell.day}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarCard;

import { useEffect, useState } from "react";
import "./App.css";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const YEAR_OPTIONS = Array.from({ length: 16 }, (_, i) => 2020 + i);
const CALENDAR_SIZES = ["small", "medium", "large"];
const MONTH_IMAGES = [
  "https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=1200&q=80",
  "https://images.unsplash.com/photo-1612178537253-bccd437b730e?w=1200&q=80",
  "https://images.unsplash.com/photo-1490750967868-88df5691cc46?w=1200&q=80",
  "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=1200&q=80",
  "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&q=80",
  "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1200&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80",
  "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=1200&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80",
  "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&q=80",
  "https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=1200&q=80",
  "https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=1200&q=80",
];
const HOLIDAYS = {
  "1-1": "New Year's Day",
  "1-26": "Republic Day",
  "4-14": "Ambedkar Jayanti",
  "5-1": "Labour Day",
  "8-15": "Independence Day",
  "10-2": "Gandhi Jayanti",
  "12-25": "Christmas",
  "12-31": "New Year's Eve",
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBetween(date, start, end) {
  if (!start || !end) return false;
  const [lo, hi] = start <= end ? [start, end] : [end, start];
  return date > lo && date < hi;
}

function buildCells(year, month) {
  const first = getFirstDayOfMonth(year, month);
  const totalDays = getDaysInMonth(year, month);
  const previousMonthDays = getDaysInMonth(year, month - 1);
  const cells = [];

  for (let i = 0; i < first; i += 1) {
    cells.push({ day: previousMonthDays - first + i + 1, faded: true, key: `p${i}` });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push({ day, faded: false, key: `c${day}` });
  }

  const remaining = 42 - cells.length;
  for (let day = 1; day <= remaining; day += 1) {
    cells.push({ day, faded: true, key: `n${day}` });
  }

  return cells;
}

function shiftMonth(month, year, direction) {
  const total = year * 12 + month + direction;
  return {
    month: ((total % 12) + 12) % 12,
    year: Math.floor(total / 12),
  };
}

function toDayKey(date) {
  return formatDateInput(date);
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatSelection(startDate, endDate, month, year) {
  if (!startDate) return `${MONTHS[month]} ${year}`;
  const options = { month: "short", day: "numeric" };
  if (!endDate || isSameDay(startDate, endDate)) {
    return startDate.toLocaleDateString("en-US", options);
  }
  const [lo, hi] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
  return `${lo.toLocaleDateString("en-US", options)} - ${hi.toLocaleDateString("en-US", options)}`;
}

function daysBetween(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  return Math.round(Math.abs(endDate - startDate) / 86400000) + 1;
}

function getDatesInRange(startDate, endDate) {
  if (!startDate) return [];
  const [lo, hi] = endDate && startDate > endDate ? [endDate, startDate] : [startDate, endDate || startDate];
  const dates = [];
  const cursor = new Date(lo);

  while (cursor <= hi) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function getHostname(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "saved-link";
  }
}

function normaliseUrl(url) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function sortPlannerEntries(entries) {
  return [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.time !== b.time) return a.time.localeCompare(b.time);
    return a.createdAt - b.createdAt;
  });
}

function createPlannerEntry(date) {
  const now = Date.now();
  return {
    id: now + Math.random(),
    date: formatDateInput(date),
    time: "",
    title: "",
    link: "",
    notes: "",
    done: false,
    createdAt: now,
  };
}

function PlannerPanel({
  label,
  daysCount,
  entries,
  hasSelection,
  onAddEntry,
  onUpdateEntry,
  onToggleDone,
  onDeleteEntry,
  onClearSelection,
}) {
  return (
    <aside className="planner-panel">
      <div className="planner-header">
        <div>
          <div className="planner-label">Task Planner</div>
          <div className="planner-subtitle">
            {label}
            {daysCount > 1 ? ` - ${daysCount} days` : ""}
          </div>
        </div>
        <button type="button" className="planner-add-btn" onClick={onAddEntry}>
          + Task
        </button>
      </div>

      <div className="planner-toolbar">
        <span className="planner-count">
          {entries.length} {entries.length === 1 ? "item" : "items"}
        </span>
        <span className="planner-resize-hint">Drag bottom-right corner to resize</span>
      </div>

      <div className="planner-scroll">
        {entries.length === 0 ? (
          <div className="planner-empty">
            <strong>No tasks yet.</strong>
            <span>Add tasks for one day or a multi-day plan with time, links, and notes.</span>
          </div>
        ) : (
          <div className="planner-list">
            {entries.map((entry) => (
              <article key={entry.id} className={`planner-card${entry.done ? " done" : ""}`}>
                <div className="planner-card-top">
                  <label className="planner-check-wrap">
                    <input
                      type="checkbox"
                      checked={entry.done}
                      onChange={() => onToggleDone(entry.date, entry.id)}
                    />
                    <span>Done</span>
                  </label>
                  <input
                    className="planner-date-input"
                    type="date"
                    value={entry.date}
                    onChange={(event) => onUpdateEntry(entry.date, entry.id, "date", event.target.value)}
                  />
                  <input
                    className="planner-time-input"
                    type="time"
                    value={entry.time}
                    onChange={(event) => onUpdateEntry(entry.date, entry.id, "time", event.target.value)}
                  />
                  <button
                    type="button"
                    className="planner-delete-btn"
                    onClick={() => onDeleteEntry(entry.date, entry.id)}
                  >
                    Remove
                  </button>
                </div>

                <input
                  className="planner-title-input"
                  type="text"
                  value={entry.title}
                  placeholder="Task title"
                  onChange={(event) => onUpdateEntry(entry.date, entry.id, "title", event.target.value)}
                />

                <input
                  className="planner-link-input"
                  type="text"
                  value={entry.link}
                  placeholder="Save a small link"
                  onChange={(event) => onUpdateEntry(entry.date, entry.id, "link", event.target.value)}
                />

                {entry.link.trim() && (
                  <a
                    className="planner-link-preview"
                    href={normaliseUrl(entry.link)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open {getHostname(normaliseUrl(entry.link))}
                  </a>
                )}

                <textarea
                  className="planner-notes-input"
                  value={entry.notes}
                  placeholder="Key notes for this task"
                  onChange={(event) => onUpdateEntry(entry.date, entry.id, "notes", event.target.value)}
                />
              </article>
            ))}
          </div>
        )}
      </div>

      {hasSelection && (
        <button type="button" className="clear-range-btn" onClick={onClearSelection}>
          Clear selection
        </button>
      )}
    </aside>
  );
}

function DayCell({
  cell,
  month,
  year,
  startDate,
  endDate,
  hoverDate,
  planner,
  onClick,
  onHover,
  onLeave,
}) {
  if (cell.faded) {
    return (
      <div className="day-cell faded" aria-hidden="true">
        <span className="day-num">{cell.day}</span>
      </div>
    );
  }

  const date = new Date(year, month, cell.day);
  const today = new Date();
  const holiday = HOLIDAYS[`${month + 1}-${cell.day}`];
  const previewEdge = endDate || hoverDate;
  const isTodayCell = isSameDay(date, today);
  const isStart = isSameDay(date, startDate);
  const isEnd = isSameDay(date, endDate);
  const inRange = isBetween(date, startDate, previewEdge);
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const hasTask = Boolean(planner[toDayKey(date)]?.length);

  const classes = [
    "day-cell",
    isTodayCell && "today",
    isStart && "range-start",
    isEnd && "range-end",
    inRange && "in-range",
    isWeekend && "weekend",
    holiday && "holiday",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      title={holiday || undefined}
      onClick={() => onClick(date)}
      onMouseEnter={() => onHover(date)}
      onMouseLeave={onLeave}
    >
      <span className="day-num">{cell.day}</span>
      {holiday && <span className="holiday-dot" />}
      {hasTask && <span className="note-dot" />}
    </button>
  );
}

function CalendarGrid({
  year,
  month,
  startDate,
  endDate,
  hoverDate,
  planner,
  onDateClick,
  onDateHover,
  onDateLeave,
}) {
  const cells = buildCells(year, month);

  return (
    <section className="calendar-grid">
      <div className="day-headers">
        {DAYS_SHORT.map((day) => (
          <div key={day} className={`day-header${day === "Sat" || day === "Sun" ? " weekend-header" : ""}`}>
            {day}
          </div>
        ))}
      </div>
      <div className="day-cells">
        {cells.map((cell) => (
          <DayCell
            key={cell.key}
            cell={cell}
            month={month}
            year={year}
            startDate={startDate}
            endDate={endDate}
            hoverDate={hoverDate}
            planner={planner}
            onClick={onDateClick}
            onHover={onDateHover}
            onLeave={onDateLeave}
          />
        ))}
      </div>
    </section>
  );
}

function MonthYearDropdown({ isOpen, month, year, onToggle, onMonthChange, onYearChange, onToday }) {
  return (
    <div className="picker-shell">
      <button type="button" className="picker-toggle" onClick={onToggle} aria-expanded={isOpen}>
        <span className="picker-coin" aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="picker-menu">
          <label className="picker-field">
            <span className="picker-label">Month</span>
            <select className="picker-select" value={month} onChange={(event) => onMonthChange(Number(event.target.value))}>
              {MONTHS.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="picker-field">
            <span className="picker-label">Year</span>
            <select className="picker-select" value={year} onChange={(event) => onYearChange(Number(event.target.value))}>
              {YEAR_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="picker-today" onClick={onToday}>
            Today
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);
  const [planner, setPlanner] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("wall-calendar-planner") || "{}");
    } catch {
      return {};
    }
  });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [turnDirection, setTurnDirection] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [calendarSize, setCalendarSize] = useState(() => {
    try {
      return localStorage.getItem("wall-calendar-size") || "medium";
    } catch {
      return "medium";
    }
  });

  useEffect(() => {
    localStorage.setItem("wall-calendar-planner", JSON.stringify(planner));
  }, [planner]);

  useEffect(() => {
    localStorage.setItem("wall-calendar-size", calendarSize);
  }, [calendarSize]);

  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const isRangeSelected = startDate && endDate && !isSameDay(startDate, endDate);
  const selectedDates = getDatesInRange(startDate, endDate);
  const selectedKeys = new Set(selectedDates.map(toDayKey));

  const plannerEntries = sortPlannerEntries(
    Object.entries(planner).flatMap(([dateKey, items]) => {
      if (selectedKeys.size > 0) {
        if (!selectedKeys.has(dateKey)) return [];
        return items;
      }

      const date = parseDateInput(dateKey);
      if (date.getFullYear() !== year || date.getMonth() !== month) return [];
      return items;
    }),
  );

  const selectionLabel = formatSelection(startDate, endDate, month, year);
  const selectedCount = isRangeSelected ? daysBetween(startDate, endDate) : startDate ? 1 : 0;
  const sizeIndex = CALENDAR_SIZES.indexOf(calendarSize);

  const changeMonth = (direction) => {
    const next = shiftMonth(month, year, direction);
    setTurnDirection(direction > 0 ? "turn-next" : "turn-prev");
    setImgLoaded(false);
    setMonth(next.month);
    setYear(next.year);
    setStartDate(null);
    setEndDate(null);
    setHoverDate(null);
  };

  const goToToday = () => {
    setImgLoaded(false);
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setStartDate(null);
    setEndDate(null);
    setHoverDate(null);
    setIsPickerOpen(false);
  };

  const handleDateClick = (date) => {
    if (!startDate || endDate) {
      setStartDate(date);
      setEndDate(null);
      return;
    }

    if (isSameDay(date, startDate)) {
      setStartDate(null);
      setEndDate(null);
      return;
    }

    if (date < startDate) {
      setEndDate(startDate);
      setStartDate(date);
      return;
    }

    setEndDate(date);
  };

  const setMonthAndYear = (nextMonth, nextYear = year) => {
    if (nextMonth !== month || nextYear !== year) {
      setTurnDirection(nextMonth > month || nextYear > year ? "turn-next" : "turn-prev");
      setImgLoaded(false);
    }
    setMonth(nextMonth);
    setYear(nextYear);
    setStartDate(null);
    setEndDate(null);
    setHoverDate(null);
  };

  const addPlannerEntry = () => {
    const defaultDate = startDate || (isCurrentMonth ? today : new Date(year, month, 1));
    const newEntry = createPlannerEntry(defaultDate);

    setPlanner((current) => ({
      ...current,
      [newEntry.date]: [...(current[newEntry.date] || []), newEntry],
    }));
  };

  const updatePlannerEntry = (dateKey, entryId, field, value) => {
    if (field === "date") {
      if (!value) return;

      setPlanner((current) => {
        const sourceItems = current[dateKey] || [];
        const entry = sourceItems.find((item) => item.id === entryId);
        if (!entry) return current;

        const nextKey = value;
        const nextEntry = { ...entry, date: nextKey };
        const nextSourceItems = sourceItems.filter((item) => item.id !== entryId);
        const nextState = { ...current, [dateKey]: nextSourceItems };

        if (nextSourceItems.length === 0) {
          delete nextState[dateKey];
        }

        nextState[nextKey] = [...(nextState[nextKey] || []), nextEntry];
        return nextState;
      });
      return;
    }

    setPlanner((current) => ({
      ...current,
      [dateKey]: (current[dateKey] || []).map((item) =>
        item.id === entryId ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const togglePlannerDone = (dateKey, entryId) => {
    setPlanner((current) => ({
      ...current,
      [dateKey]: (current[dateKey] || []).map((item) =>
        item.id === entryId ? { ...item, done: !item.done } : item,
      ),
    }));
  };

  const deletePlannerEntry = (dateKey, entryId) => {
    setPlanner((current) => {
      const nextItems = (current[dateKey] || []).filter((item) => item.id !== entryId);
      const nextState = { ...current, [dateKey]: nextItems };

      if (nextItems.length === 0) {
        delete nextState[dateKey];
      }

      return nextState;
    });
  };

  const resizeCalendar = (direction) => {
    const nextIndex = Math.min(
      CALENDAR_SIZES.length - 1,
      Math.max(0, sizeIndex + direction),
    );
    setCalendarSize(CALENDAR_SIZES[nextIndex]);
  };

  return (
    <div className="app-root">
      <div className="hanger" aria-hidden="true">
        <span className="hanger-hook" />
      </div>

      <main
        className={`calendar-wrapper size-${calendarSize}${turnDirection ? ` ${turnDirection}` : ""}`}
        onAnimationEnd={() => setTurnDirection("")}
      >
        <div className="calendar-sheet">
          <div className="binding">
            {Array.from({ length: 22 }).map((_, index) => (
              <span key={index} className="coil-ring" />
            ))}
          </div>

          <section className="hero-panel">
            <div className={`hero-img-wrap${imgLoaded ? " loaded" : ""}`}>
              <img
                src={MONTH_IMAGES[month]}
                alt={MONTHS[month]}
                className="hero-img"
                onLoad={() => setImgLoaded(true)}
              />
            </div>
            <div className="hero-caption">
              <span className="hero-year">{year}</span>
              <span className="hero-month">{MONTHS[month].toUpperCase()}</span>
            </div>
            <div className="month-nav">
              <div className="size-controls" aria-label="Calendar size controls">
                <button
                  type="button"
                  className="size-btn"
                  onClick={() => resizeCalendar(-1)}
                  disabled={sizeIndex === 0}
                  title="Smaller calendar"
                >
                  A-
                </button>
                <button
                  type="button"
                  className="size-btn"
                  onClick={() => resizeCalendar(1)}
                  disabled={sizeIndex === CALENDAR_SIZES.length - 1}
                  title="Larger calendar"
                >
                  A+
                </button>
              </div>
              {!isCurrentMonth && (
                <button type="button" className="nav-btn today-btn" onClick={goToToday}>
                  Today
                </button>
              )}
            </div>
            <div className="hero-angle hero-angle-left" />
            <div className="hero-angle hero-angle-center" />
            <div className="hero-angle hero-angle-right" />
          </section>

          <section className="bottom-panel">
            <div className="notes-column">
              <MonthYearDropdown
                isOpen={isPickerOpen}
                month={month}
                year={year}
                onToggle={() => setIsPickerOpen((open) => !open)}
                onMonthChange={(nextMonth) => setMonthAndYear(nextMonth, year)}
                onYearChange={(nextYear) => setMonthAndYear(month, nextYear)}
                onToday={goToToday}
              />

              <PlannerPanel
                label={selectionLabel}
                daysCount={selectedCount}
                entries={plannerEntries}
                hasSelection={Boolean(startDate)}
                onAddEntry={addPlannerEntry}
                onUpdateEntry={updatePlannerEntry}
                onToggleDone={togglePlannerDone}
                onDeleteEntry={deletePlannerEntry}
                onClearSelection={() => {
                  setStartDate(null);
                  setEndDate(null);
                  setHoverDate(null);
                }}
              />
            </div>

            <div className="calendar-section">
              <CalendarGrid
                year={year}
                month={month}
                startDate={startDate}
                endDate={endDate}
                hoverDate={hoverDate}
                planner={planner}
                onDateClick={handleDateClick}
                onDateHover={(date) => {
                  if (startDate && !endDate) {
                    setHoverDate(date);
                  }
                }}
                onDateLeave={() => setHoverDate(null)}
              />
            </div>
          </section>
        </div>

        <button
          type="button"
          className="page-corner page-corner-left"
          onClick={() => changeMonth(-1)}
          aria-label="Previous month"
          title="Previous month"
        >
          <span className="corner-label">Previous Month</span>
        </button>
        <button
          type="button"
          className="page-corner page-corner-right"
          onClick={() => changeMonth(1)}
          aria-label="Next month"
          title="Next month"
        >
          <span className="corner-label">Next Month</span>
        </button>
      </main>
    </div>
  );
}

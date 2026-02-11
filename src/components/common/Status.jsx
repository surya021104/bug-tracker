// src/components/common/Status.jsx
export default function Status({ value, onChange, issue }) {
  // ✅ Normalize ONLY before Open happens
  const displayValue =
    value === "Open" && !issue?.openedBy ? "Todo" : value;

  return (
    <select
      className={`status-pill status-${displayValue
        .toLowerCase()
        .replace(" ", "-")}`}
      value={displayValue}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="Todo">Todo</option>

      {/* 🔒 Disable after first Open */}
      <option value="Open" disabled={!!issue?.openedBy}>
        Open
      </option>

      <option value="In Progress">In Progress</option>
      <option value="Fixed">Fixed</option>
      <option value="Closed">Closed</option>
    </select>
  );
}

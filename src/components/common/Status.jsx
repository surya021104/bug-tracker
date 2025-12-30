import { STATUS_CONFIG } from "./statusConfig";

export default function StatusDropdown({ value, onChange }) {
  const config = STATUS_CONFIG[value];

  return (
    <select
      className="status-pill"
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ backgroundColor: config.color }}
    >
      {Object.keys(STATUS_CONFIG).map(status => (
        <option key={status} value={status}>
          {STATUS_CONFIG[status].label}
        </option>
      ))}
    </select>
  );
}

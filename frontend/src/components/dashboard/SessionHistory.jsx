import { Link } from "react-router-dom";
import StatusBadge from "../results/StatusBadge";
import { formatISTDateTime } from "../../utils/datetime";

export default function SessionHistory({ sessions = [] }) {
  if (!sessions.length) return <p className="text-sm text-ink-400">No sessions yet. Run an assessment first.</p>;
  return (
    <div className="overflow-x-auto glass-card">
      <table className="w-full text-sm text-ink-100">
        <thead>
          <tr className="text-left text-ink-400">
            <th className="p-3">When (IST)</th>
            <th>Status</th>
            <th>D</th>
            <th>A</th>
            <th>S</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id} className="border-t border-white/10">
              <td className="p-3">{formatISTDateTime(s.created_at)}</td>
              <td>
                <StatusBadge label={s.status_label} />
              </td>
              <td>{s.depression_score.toFixed(1)}</td>
              <td>{s.anxiety_score.toFixed(1)}</td>
              <td>{s.stress_score.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link to="/assessment" className="sr-only">
        New
      </Link>
    </div>
  );
}

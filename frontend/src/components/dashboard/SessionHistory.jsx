import { Link } from "react-router-dom";
import StatusBadge from "../results/StatusBadge";

export default function SessionHistory({ sessions = [] }) {
  if (!sessions.length) return <p className="text-sm text-slate-500">No sessions yet. Run an assessment first.</p>;
  return (
    <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="p-3">When</th>
            <th>Status</th>
            <th>D</th>
            <th>A</th>
            <th>S</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id} className="border-t border-slate-100">
              <td className="p-3">{new Date(s.created_at).toLocaleString()}</td>
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

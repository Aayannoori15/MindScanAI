import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchHistory } from "../api/historyApi";
import { setHistory } from "../store/sessionSlice";
import TrendChart from "../components/dashboard/TrendChart";
import SessionHistory from "../components/dashboard/SessionHistory";

export default function Dashboard() {
  const dispatch = useDispatch();
  const { token, history, trends } = useSelector((s) => s.session);

  useEffect(() => {
    fetchHistory(token)
      .then((d) => dispatch(setHistory(d)))
      .catch(() => {});
  }, [dispatch, token]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="font-display text-3xl">Trend dashboard</h1>
      <p className="text-slate-500">Longitudinal depression, anxiety, and stress across sessions.</p>
      {trends?.available && (
        <div className="flex gap-3 text-sm">
          {["depression", "anxiety", "stress"].map((k) => (
            <span key={k} className="px-3 py-1 rounded-full bg-white border capitalize">
              {k}: {trends[k]}
            </span>
          ))}
        </div>
      )}
      <TrendChart sessions={history} />
      <SessionHistory sessions={history} />
    </div>
  );
}

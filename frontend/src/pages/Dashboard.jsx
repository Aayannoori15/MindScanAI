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
      <p className="eyebrow">Longitudinal view</p>
      <h1 className="font-display text-3xl md:text-4xl text-white -mt-2">Trend dashboard</h1>
      <p className="text-white/50 -mt-4">Longitudinal depression, anxiety, and stress across sessions.</p>
      {trends?.available && (
        <div className="flex gap-3 text-sm">
          {["depression", "anxiety", "stress"].map((k) => (
            <span key={k} className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/80 capitalize">
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

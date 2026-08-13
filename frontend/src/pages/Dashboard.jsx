import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchHistory } from "../api/historyApi";
import { setHistory } from "../store/sessionSlice";
import TrendChart from "../components/dashboard/TrendChart";
import SessionHistory from "../components/dashboard/SessionHistory";
import PageHeader from "../components/layout/PageHeader";
import PageTransition, { Reveal } from "../components/layout/PageTransition";

export default function Dashboard() {
  const dispatch = useDispatch();
  const { token, history, trends } = useSelector((s) => s.session);

  useEffect(() => {
    fetchHistory(token)
      .then((d) => dispatch(setHistory(d)))
      .catch(() => {});
  }, [dispatch, token]);

  return (
    <PageTransition className="max-w-5xl mx-auto space-y-6">
      <Reveal>
        <PageHeader
          eyebrow="Longitudinal view"
          title="Trend dashboard"
          lede="Depression, anxiety, and stress tracked across every session."
        />
      </Reveal>
      {trends?.available && (
        <Reveal>
          <div className="flex flex-wrap gap-3 text-sm">
            {["depression", "anxiety", "stress"].map((k) => (
              <span
                key={k}
                className="px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-white/80 capitalize"
              >
                {k}: <span className="text-teal">{trends[k]}</span>
              </span>
            ))}
          </div>
        </Reveal>
      )}
      <Reveal>
        <TrendChart sessions={history} />
      </Reveal>
      <Reveal>
        <SessionHistory sessions={history} />
      </Reveal>
    </PageTransition>
  );
}

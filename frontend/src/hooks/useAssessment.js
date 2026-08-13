import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { runAssessment } from "../api/assessmentApi";
import { setError, setLoading, setResult } from "../store/assessmentSlice";

export function useAssessment() {
  const dispatch = useDispatch();
  const nav = useNavigate();
  const state = useSelector((s) => s.assessment);
  const token = useSelector((s) => s.session.token);

  const submit = async () => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const result = await runAssessment({ ...state, token });
      dispatch(setResult(result));
      nav("/results");
    } catch (e) {
      const raw = e?.message || "Assessment failed";
      const message =
        raw === "Failed to fetch"
          ? "The API did not respond. Wait until /api/health shows models_ready true, then try again. A long clip can also time out on Render — use a short recording."
          : raw;
      dispatch(setError(message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return { ...state, submit };
}

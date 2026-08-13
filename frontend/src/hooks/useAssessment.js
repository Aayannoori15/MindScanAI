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
      const raw = String(e?.message || "Assessment failed");
      const message = /failed to fetch|networkerror|load failed/i.test(raw)
          ? "The server dropped the request (often out of memory). After this deploy, Render will not load PyTorch — try Run MindScan again."
          : raw;
      dispatch(setError(message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return { ...state, submit };
}

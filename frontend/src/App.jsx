import { Navigate, Route, Routes } from "react-router-dom";
import PageContainer from "./components/layout/PageContainer";
import Landing from "./pages/Landing";
import Assessment from "./pages/Assessment";
import Results from "./pages/Results";
import Dashboard from "./pages/Dashboard";
import RealtimeAnalysis from "./pages/RealtimeAnalysis";
import RelaxHub from "./pages/RelaxHub";
import Companion from "./pages/Companion";
import Library from "./pages/Library";
import Help from "./pages/Help";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<PageContainer />}>
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/results" element={<Results />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/realtime" element={<RealtimeAnalysis />} />
        <Route path="/relax" element={<RelaxHub />} />
        <Route path="/companion" element={<Companion />} />
        <Route path="/library" element={<Library />} />
        <Route path="/help" element={<Help />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="/home" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

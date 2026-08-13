import { downloadClientPdf } from "../../utils/pdfGenerator";

export default function DownloadReport({ result }) {
  const serverPdf = () => {
    window.open(`/api/report/${result.session_id}/pdf`, "_blank");
  };
  return (
    <div className="flex flex-wrap gap-3">
      <button onClick={serverPdf} className="px-4 py-2 rounded-xl bg-navy text-white text-sm">
        Download clinical PDF
      </button>
      <button onClick={() => downloadClientPdf(result)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm">
        Quick client PDF
      </button>
    </div>
  );
}

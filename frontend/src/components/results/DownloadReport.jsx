import { downloadClientPdf } from "../../utils/pdfGenerator";

export default function DownloadReport({ result }) {
  const serverPdf = () => {
    window.open(`/api/report/${result.session_id}/pdf`, "_blank");
  };
  return (
    <div className="flex flex-wrap gap-3">
      <button onClick={serverPdf} className="pill-btn-solid">
        Download clinical PDF
      </button>
      <button onClick={() => downloadClientPdf(result)} className="pill-btn-ghost">
        Quick client PDF
      </button>
    </div>
  );
}

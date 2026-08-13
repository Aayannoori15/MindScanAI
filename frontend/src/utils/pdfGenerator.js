import { jsPDF } from "jspdf";

export function downloadClientPdf(result) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("MindScan AI Support Report", 14, 20);
  doc.setFontSize(11);
  doc.text(`Status: ${result.status_label}`, 14, 32);
  doc.text(`Depression ${result.scores.depression}/34 (${result.scores.depression_range})`, 14, 42);
  doc.text(`Anxiety ${result.scores.anxiety}/24 (${result.scores.anxiety_range})`, 14, 50);
  doc.text(`Stress ${result.scores.stress}/39 (${result.scores.stress_range})`, 14, 58);
  const plain = result.explanation?.level1_plain_english || "";
  doc.text(doc.splitTextToSize(plain, 180), 14, 72);
  doc.setFontSize(9);
  doc.text(doc.splitTextToSize(result.explanation?.disclaimer || "", 180), 14, 270);
  doc.save(`mindscan-session-${result.session_id}.pdf`);
}

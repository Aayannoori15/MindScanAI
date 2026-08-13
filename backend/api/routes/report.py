from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from backend.database.models import AssessmentSession
from backend.database.session import get_db

router = APIRouter()


def _html_report(s: AssessmentSession) -> str:
    exp = s.explanation or {}
    shap = (exp.get("level2_visual") or {}).get("shap_waterfall") or []
    rows = "".join(
        f"<tr><td>{i.get('label')}</td><td>{i.get('value')}</td><td>{i.get('contribution')}</td></tr>"
        for i in shap[:12]
    )
    heatmap = ((exp.get("level2_visual") or {}).get("gradcam") or {}).get("heatmap_png_b64")
    img = f'<img src="data:image/png;base64,{heatmap}" width="240"/>' if heatmap else ""
    return f"""
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        body {{ font-family: Inter, Helvetica, sans-serif; color: #0F1B2D; padding: 32px; }}
        h1 {{ font-size: 22px; }}
        .muted {{ color: #64748b; font-size: 12px; }}
        .badge {{ display:inline-block; background:#00BFA6; color:#0F1B2D; padding:4px 10px; border-radius:999px; }}
        table {{ width:100%; border-collapse: collapse; margin-top: 12px; }}
        td, th {{ border-bottom: 1px solid #e2e8f0; padding: 8px; text-align:left; font-size: 12px; }}
        .box {{ background:#F8FAFC; padding:16px; border-radius:12px; margin:16px 0; }}
      </style>
    </head>
    <body>
      <h1>MindScan AI Clinical Support Report</h1>
      <p class="muted">Decision-support only — not a diagnosis. Session #{s.id} · {s.created_at}</p>
      <p>Status: <span class="badge">{s.status_label}</span></p>
      <div class="box">
        <p>Depression: {s.depression_score:.1f}/34</p>
        <p>Anxiety: {s.anxiety_score:.1f}/24</p>
        <p>Stress: {s.stress_score:.1f}/39</p>
      </div>
      {img}
      <p>{exp.get("level1_plain_english", "")}</p>
      <h3>Feature contributions</h3>
      <table>
        <tr><th>Feature</th><th>Value</th><th>Contribution</th></tr>
        {rows}
      </table>
      <p class="muted">{exp.get("disclaimer", "")}</p>
    </body>
    </html>
    """


@router.get("/{session_id}/pdf")
def download_pdf(session_id: int, db: Session = Depends(get_db)):
    s = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
    if not s:
        raise HTTPException(404, "Session not found")
    html = _html_report(s)
    try:
        from weasyprint import HTML

        pdf = HTML(string=html).write_pdf()
        return Response(content=pdf, media_type="application/pdf")
    except Exception:
        return Response(content=html, media_type="text/html")

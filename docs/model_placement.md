# Model placement

Trained PyTorch files live here:

```
backend/models/classification/facial_encoder.pt   # training/train_facial.py, on dataset/Extracted_images
backend/models/classification/speech_encoder.pt   # training/train_speech.py, on dataset/Audios
```

`registry.using_mock` (backend/core/model_loader.py) goes `false` once both files are present and
`USE_MOCK_INFERENCE=false` is set — that switches the facial/speech embeddings used by fusion and the
Grad-CAM/LIME explainers over to the real trained encoders.

`mental_health_classifier.pt`, `depression_regressor.pt`, `anxiety_regressor.pt`, `stress_regressor.pt`,
and `multimodal_fusion.pt` are **not populated by default**. `dataset/mental_health_multimodal.csv`
(4000 rows, 18 features) was checked for a learnable relationship between its features and
`Mental_Health_Status`/D-A-S scores two ways — linear correlation (all |r| < 0.05) and a 300-tree random
forest (39.3% accuracy vs. a 40.7% majority-class baseline; per-feature importances uniform at ~1/16) —
and neither found signal above the trivial baseline. A model trained on it would just fit noise, so the
4-class status and D/A/S scores are computed by the hand-crafted, explainable heuristics in
`backend/core/inference/` instead (`classify_status`, `estimate_scores`). `training/train_fusion.py` still
trains and exports all five of these files if you want to try them, or if a tabular dataset with real
feature-label signal becomes available later; `backend/core/model_loader.py` deliberately does not load
them, so dropping them in has no effect without also wiring `ModelRegistry` back up to use them.

Input specs (from the Hack2Health dataset description):

| Stream | Tensor |
|---|---|
| Facial | `(1, 1, 48, 48)` grayscale float32 0–1 (FER) |
| Speech | `(T, 128)` log-mel; optional RAVDESS filename metadata |
| Numerical | `(18,)` z-scored columns listed in `docs/dataset.md` |

Labels: `Healthy`, `Mild_Stress`, `Moderate_Stress`, `Severe_Stress`.
Scores: depression 0–34, anxiety 0–24, stress 0–39.

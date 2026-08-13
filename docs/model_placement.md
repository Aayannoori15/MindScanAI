# Model placement

Put trained PyTorch files here:

```
backend/models/classification/mental_health_classifier.pt
backend/models/classification/facial_encoder.pt
backend/models/classification/speech_encoder.pt
backend/models/regression/depression_regressor.pt
backend/models/regression/anxiety_regressor.pt
backend/models/regression/stress_regressor.pt
backend/models/fusion/multimodal_fusion.pt
```

Input specs (from the Hack2Health dataset description):

| Stream | Tensor |
|---|---|
| Facial | `(1, 1, 48, 48)` grayscale float32 0–1 (FER) |
| Speech | `(T, 128)` log-mel; optional RAVDESS filename metadata |
| Numerical | `(18,)` z-scored columns listed in `docs/dataset.md` |

Labels: `Healthy`, `Mild_Stress`, `Moderate_Stress`, `Severe_Stress`.
Scores: depression 0–34, anxiety 0–24, stress 0–39.

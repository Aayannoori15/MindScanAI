# Place trained weights here. The API boots with a transparent mock pipeline
# until these files exist. Set USE_MOCK_INFERENCE=false in .env after dropping models.

## Expected files

classification/facial_encoder.pt            # train via training/train_facial.py
classification/speech_encoder.pt             # train via training/train_speech.py
classification/mental_health_classifier.pt   # train via training/train_fusion.py
regression/depression_regressor.pt            # train via training/train_fusion.py
regression/anxiety_regressor.pt                # train via training/train_fusion.py
regression/stress_regressor.pt                  # train via training/train_fusion.py
fusion/multimodal_fusion.pt                      # train via training/train_fusion.py

The classifier/regressors are trained on synthetic (regenerated, not real) labels —
see docs/model_placement.md for what that means and why, and their test-set accuracy.
Either way, `backend/api/routes/assessment.py` falls back to the heuristic engine
(backend/core/inference/) whenever these files aren't present.

## Input tensors (dataset-aligned)

- Facial: float32, shape (1, 1, 48, 48), grayscale FER, 0–1
- Speech: float32, shape (N,), raw mono waveform, 16kHz; RAVDESS 7-token filenames are parsed
- Numerical: float32, shape (18,) z-scored tabular columns (see docs/dataset.md)

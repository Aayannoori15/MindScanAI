# Place trained weights here. The API boots with a transparent mock pipeline
# until these files exist. Set USE_MOCK_INFERENCE=false in .env after dropping models.

## Expected files

classification/mental_health_classifier.pt
classification/facial_encoder.pt
classification/speech_encoder.pt
regression/depression_regressor.pt
regression/anxiety_regressor.pt
regression/stress_regressor.pt
fusion/multimodal_fusion.pt

## Input tensors (dataset-aligned)

- Facial: float32, shape (1, 1, 48, 48), grayscale FER, 0–1
- Speech: float32, shape (T, 128) log-mel; RAVDESS 7-token filenames are parsed
- Numerical: float32, shape (18,) z-scored tabular columns (see docs/dataset.md)

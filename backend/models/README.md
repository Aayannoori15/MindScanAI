# Place trained weights here. The API boots with a transparent mock pipeline
# until these files exist. Set USE_MOCK_INFERENCE=false in .env after dropping models.

## Expected files

classification/facial_encoder.pt   # train via training/train_facial.py
classification/speech_encoder.pt   # train via training/train_speech.py

Status classification and D/A/S scoring intentionally stay on the heuristic engine
(backend/core/inference/) — see docs/model_placement.md for why the tabular
classifier/regressor/fusion files aren't trained/loaded by default.

## Input tensors (dataset-aligned)

- Facial: float32, shape (1, 1, 48, 48), grayscale FER, 0–1
- Speech: float32, shape (T, 128) log-mel; RAVDESS 7-token filenames are parsed
- Numerical: float32, shape (18,) z-scored tabular columns (see docs/dataset.md)

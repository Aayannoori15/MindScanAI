#!/bin/sh
# Render native Python build. Skip PyTorch/opencv/librosa on Render's 1GB
# instance unless LOAD_NEURAL_ENCODERS=true (needs ~4GB).
set -e
pip install -r requirements.txt
if [ -z "${RENDER:-}" ] || [ "${LOAD_NEURAL_ENCODERS:-}" = "true" ]; then
  pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
  pip install -r requirements-ml.txt
else
  echo "Skipping PyTorch + requirements-ml.txt (1GB Render host)."
fi
cd frontend
npm ci
npm run build

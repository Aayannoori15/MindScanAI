#!/bin/sh
# Render native Python build: API deps + CPU PyTorch + frontend production bundle.
set -e
pip install -r requirements.txt
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements-ml.txt
cd frontend
npm ci
npm run build

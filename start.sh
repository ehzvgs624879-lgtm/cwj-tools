#!/bin/bash
set -e

# Install dependencies
pip install -r requirements.txt

# Load .env if present
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Start the Flask app
python AI_Center/aichat.py

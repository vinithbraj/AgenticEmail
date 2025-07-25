#!/bin/bash

# Run environment setup first
# ./setup_env.sh

# Continue with pulling model and starting server
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000

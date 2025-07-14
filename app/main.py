"""
Copyright (c) 2025 Vinith Raj

This file is part of AgenticEmail.
AgenticEmail is free software: you can use, modify, and/or distribute it
under the terms of the MIT License. See the LICENSE file for more details.

You should have received a copy of the MIT License along with this program.
If not, see <https://opensource.org/licenses/MIT>.

AgenticEmail - Backend API Server
=================================

This module implements the FastAPI-based backend server for the AgenticEmail Chrome extension.
It handles incoming requests to generate email responses using a locally-hosted language model.

Key Components:
- FastAPI application setup and route handlers
- Integration with local LLM (Ollama)
- Environment configuration management
- Request/response handling for email generation

Environment Variables:
- OLLAMA_HOST: URL of the Ollama server (default: http://localhost:11434)
- MODEL_NAME: Name of the language model to use (default: mistral)

Endpoints:
- GET /health: Health check endpoint
- POST /generate: Generate email response based on provided parameters

Dependencies:
- fastapi: Web framework
- requests: HTTP client
- python-dotenv: Environment variable management
"""

from time import sleep
from fastapi import FastAPI, Request
import requests
import json
from dotenv import load_dotenv
import os
import subprocess
import shutil
import atexit
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi import Request
from pydantic import BaseModel
from contextlib import asynccontextmanager
import subprocess
import shutil
import requests

# Load .env file
load_dotenv()

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

ollama_process = None  # Global process holder

# Read model name from model.txt with fallback to environment variable or default
def get_model_name() -> str:
    try:
        with open('model.txt', 'r') as f:
            model_name = f.read().strip()
            if model_name:
                return model_name
    except FileNotFoundError:
        pass
    return os.getenv("MODEL_NAME", "mistral")

def pull_model():
    model_name = get_model_name()
    print(f"Pulling model: {model_name}")

    try:
        subprocess.run(
            [OLLAMA_PATH, "pull", model_name],
            check=True
        )
        print(f"Model '{model_name}' pulled successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Failed to pull model '{model_name}':", e)
        raise


ollama_process = None
OLLAMA_PATH = shutil.which("ollama") or "/usr/local/bin/ollama"

# 👇 Lifespan context
@asynccontextmanager
async def lifespan(app: FastAPI):
    global ollama_process

    # --- Startup logic ---
    print("Starting ollama serve...")
    ollama_process = subprocess.Popen([OLLAMA_PATH, "serve"])
    print(f"Ollama serve started with PID {ollama_process.pid}")
    print("Pulling model...")
    subprocess.run([OLLAMA_PATH, "pull", "phi3"], check=True)

    yield  # 👈 your app runs here

    # --- Shutdown logic ---
    print("Shutting down ollama...")
    if ollama_process:
        ollama_process.terminate()
        try:
            ollama_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            print("Force killing ollama...")
            ollama_process.kill()


app = FastAPI(lifespan=lifespan)

MODEL_NAME = get_model_name()
DEFAULT_PROMPT = """
You are an email response generator.

Your goal is to:
-- Generate an email response using a "{tone}" tone.

Additional optional instructions include 
-- {action_instruction}

Limit the response to:
-- {char_limit} characters.

Only generate a single email. Do not provide examples, alternatives, or additional suggestions. Do not explain your reasoning or wrap the output in commentary.

Here is the email to which the reply must be generated:
-- {email}
""".strip()

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/generate")
async def generate_email(request: Request):
    data = await request.json()
    tone = data.get("tone", "")
    char_limit = data.get("char_limit", 500)
    action_instruction = data.get("action_instruction", "")
    email_body = data.get("email", "")

    # Format the prompt with variables and combine with email body
    formatted_prompt = DEFAULT_PROMPT.format(tone=tone, action_instruction=action_instruction, char_limit=char_limit, email=email_body.strip())

    response = requests.post(
        f"{OLLAMA_HOST}/api/generate",
        json={"model": MODEL_NAME, "prompt": formatted_prompt},
        stream=True
    )

    full_response = ""

    for line in response.iter_lines():
        if line:
            chunk = json.loads(line)
            full_response += chunk.get("response", "")

    return {"response": full_response}

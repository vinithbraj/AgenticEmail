from fastapi import FastAPI, Request
import requests
import json
from dotenv import load_dotenv
import os

# Load .env file
load_dotenv()

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
MODEL_NAME = os.getenv("MODEL_NAME", "phi3")

app = FastAPI()

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/generate")
async def generate_email(request: Request):
    data = await request.json()
    prompt = data.get("prompt", "")
    email_body = data.get("email", "")

    # Combine both parts into the full LLM prompt
    full_prompt = f"{prompt.strip()}\n\n{email_body.strip()}"
   

    print(full_prompt)

    response = requests.post(
        f"{OLLAMA_HOST}/api/generate",
        json={"model": MODEL_NAME, "prompt": full_prompt},
        stream=True
    )

    print(response.text)

    full_response = ""

    for line in response.iter_lines():
        if line:
            chunk = json.loads(line)
            full_response += chunk.get("response", "")

    return {"response": full_response}

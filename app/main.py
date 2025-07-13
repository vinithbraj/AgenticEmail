from fastapi import FastAPI, Request
import requests
import json
from dotenv import load_dotenv
import os

# Load .env file
load_dotenv()

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
MODEL_NAME = os.getenv("MODEL_NAME", "phi3")
DEFAULT_PROMPT = """
Generate an email response using a "{tone}" tone.

Your goal is to:
-- {action_instruction}

Limit the response to {char_limit} characters.

Here is the email to which the reply must be generated:
-- {email}
""".strip()

app = FastAPI()

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

    print(formatted_prompt)

    response = requests.post(
        f"{OLLAMA_HOST}/api/generate",
        json={"model": MODEL_NAME, "prompt": formatted_prompt},
        stream=True
    )

    print(response.text)

    full_response = ""

    for line in response.iter_lines():
        if line:
            chunk = json.loads(line)
            full_response += chunk.get("response", "")

    return {"response": full_response}

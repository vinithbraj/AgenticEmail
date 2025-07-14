"""
Copyright (c) 2025 Vinith Raj

This file is part of AgenticEmail.
AgenticEmail is free software: you can use, modify, and/or distribute it
under the terms of the MIT License. See the LICENSE file for more details.

You should have received a copy of the MIT License along with this program.
If not, see <https://opensource.org/licenses/MIT>.
"""

from time import sleep
from fastapi import FastAPI, Request
import requests
import json
from dotenv import load_dotenv
import os

# Load .env file
load_dotenv()

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
MODEL_NAME = os.getenv("MODEL_NAME", "mistral")
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

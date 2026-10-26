from ai_utils import calculate_match_score
import os
from dotenv import load_dotenv

load_dotenv()

print(f"API Key: {os.getenv('GEMINI_API_KEY')[:10]}...")

resume = "I am a software engineer with experience in React and Node.js. I have a B.Tech in Computer Science."
job = "We are looking for a Senior Frontend Engineer proficient in React and TypeScript."

score = calculate_match_score(resume, job)
print(f"Match Score: {score}")

if score == 0:
    print("FAILED: Score is 0")
else:
    print("SUCCESS: Score is non-zero")

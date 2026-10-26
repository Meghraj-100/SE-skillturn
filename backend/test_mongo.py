from pymongo import MongoClient
import certifi
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
load_dotenv(Path(__file__).parent / ".env")
load_dotenv(Path(__file__).parent.parent / ".env")

MONGO_DETAILS = os.getenv("MONGO_DETAILS")
if not MONGO_DETAILS:
    print("Error: MONGO_DETAILS environment variable is not set. Please define it in your .env file.")
    sys.exit(1)

try:
    print("Connecting to MongoDB...")
    client = MongoClient(MONGO_DETAILS, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)

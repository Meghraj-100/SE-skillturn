
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import certifi
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
load_dotenv(Path(__file__).parent / ".env")
load_dotenv(Path(__file__).parent.parent / ".env")

uri = os.getenv("MONGO_DETAILS")
if not uri:
    print("Error: MONGO_DETAILS environment variable is not set. Please define it in your .env file.")
    sys.exit(1)

# Create a new client and connect to the server
# usage of certifi.where() fixes the SSL error on Mac
client = MongoClient(uri, server_api=ServerApi('1'), tlsCAFile=certifi.where())

# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)
      
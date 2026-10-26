
from database import users_collection

users = users_collection.find()
for user in users:
    print(f"User: {user['username']}, Role: {user.get('role')}")

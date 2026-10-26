
from database import users_collection

username = "newrec"
user = users_collection.find_one({"username": username})

if user:
    print(f"Current role for {username}: '{user.get('role')}'")
    if user.get('role') != 'recruiter':
        print(f"Updating role to 'recruiter'...")
        users_collection.update_one({"username": username}, {"$set": {"role": "recruiter"}})
        print("Done.")
else:
    print(f"User {username} not found.")

# Also check student_priya
username = "student_priya"
user = users_collection.find_one({"username": username})
if user:
    print(f"Current role for {username}: '{user.get('role')}'")

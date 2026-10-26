
from database import applications_collection, users_collection
from bson import ObjectId
import sys

app_id_str = "698e41e867d1a5683b531df2" 

print(f"Testing App ID: {app_id_str}")

try:
    app_id = ObjectId(app_id_str)
    print("✅ ObjectId conversion successful")
except Exception as e:
    print(f"❌ ObjectId conversion failed: {e}")
    sys.exit(1)

app = applications_collection.find_one({"_id": app_id})
if app:
    print(f"✅ Application found: {app['_id']}")
    user_id_str = app.get("user_id")
    print(f"   User ID from app: {user_id_str} (Type: {type(user_id_str)})")
    
    if user_id_str:
        try:
           user_oid = ObjectId(user_id_str)
           print(f"   ✅ User ID ObjectId conversion successful: {user_oid}")
           user = users_collection.find_one({"_id": user_oid})
           if user:
               print(f"   ✅ User found: {user['username']}")
           else:
               print("   ❌ User NOT found in users_collection")
        except Exception as e:
            print(f"   ❌ User ID ObjectId conversion failed: {e}")

else:
    print("❌ Application not found")

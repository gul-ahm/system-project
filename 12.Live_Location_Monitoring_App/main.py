import firebase_admin
from firebase_admin import credentials, db
import time

# Load Firebase credentials
cred = credentials.Certificate("firebase_config.json")

firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://livelocationshareapp-435e1-default-rtdb.firebaseio.com/'  # Replace with your DB URL
})

# Dummy location sender (simulate movement)
def send_location(lat, lon):
    ref = db.reference("locations/user1")
    ref.set({
        'latitude': lat,
        'longitude': lon,
        'timestamp': int(time.time())
    })
    print(f"✅ Sent to Firebase: {lat}, {lon}")

# Simulated movement loop
coords = [
    (28.6139, 77.2090),
    (28.6140, 77.2092),
    (28.6141, 77.2094),
    (28.6142, 77.2096)
]

for lat, lon in coords:
    send_location(lat, lon)
    time.sleep(2)

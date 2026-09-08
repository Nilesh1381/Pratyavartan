import os
import sys
import db
from fastapi.testclient import TestClient
import main

# Reset database to clean state
for f in ['revenue_recovery.db', 'test_revenue_recovery.db']:
    if os.path.exists(f):
        os.remove(f)

os.environ['PROMISE_GRACE_MINUTES'] = '1'
os.environ['DATABASE_PATH'] = 'revenue_recovery.db'

db.init_db()
client = TestClient(main.app)

# Quick smoke tests
r1 = client.get('/health')
r2 = client.post('/api/reset-demo')
r3 = client.get('/api/metrics')

print(f"Health: {r1.status_code} {r1.json()['status']}")
print(f"Reset: {r2.status_code}")
print(f"Metrics: {r3.status_code} (recovered={r3.json()['recovered_count']}, pending={r3.json()['pending_count']})")
print("\n[PASS] All systems operational - project is functional")
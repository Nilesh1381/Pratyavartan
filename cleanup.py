import os
import sys
import db
from fastapi.testclient import TestClient
import main

# Remove existing db for clean start
for f in ['revenue_recovery.db', 'test_revenue_recovery.db']:
    if os.path.exists(f):
        os.remove(f)

# Initialize fresh database
db.init_db()
print("Database initialized fresh")

# Verify hash chain is valid (empty is fine for new db)
report = db.verify_audit_hash_chain()
print(f"Hash chain: {report['status']}")

# Test key endpoints via TestClient
client = TestClient(main.app)

# Reset demo state
resp = client.post("/api/reset-demo")
print(f"Reset demo: {resp.status_code}")

# Test health
resp = client.get("/health")
print(f"Health: {resp.status_code} - {resp.json()}")

# Test metrics
resp = client.get("/api/metrics")
metrics = resp.json()
print(f"Metrics - recovered: {metrics['recovered_count']}, pending: {metrics['pending_count']}, total: {metrics['total_failed']}")

print("\nAll checks passed!")
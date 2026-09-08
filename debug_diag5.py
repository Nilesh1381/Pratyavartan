import os
import sys
import uuid

# Remove existing db
for f in ['revenue_recovery.db', 'test_revenue_recovery.db']:
    if os.path.exists(f):
        os.remove(f)

import db
import ai_agent
import orchestrator

# Set dummy LLM key
os.environ['LLM_API_KEY'] = 'dummy'
os.environ['LLM_BASE_URL'] = 'https://api.groq.com/openai/v1'
os.environ['LLM_MODEL'] = 'llama-3.3-70b-versatile'

db.init_db()

# Test full workflow via orchestrator
pid = f"pay_test_{uuid.uuid4().hex[:6]}"
cid = str(uuid.uuid4())

# Insert payment
db.insert_or_ignore_payment(payment_id=pid, amount=150000, error_code="insufficient_funds", error_description="Low balance")

# Run single payment workflow
result = orchestrator.process_single_payment_workflow(payment_id=pid, correlation_id=cid)
print("Full workflow result:")
print(f"  success={result.get('success')}")
if result.get('success'):
    diag = result.get('diagnosis', {})
    print(f"  diagnosis={diag}")
    print(f"  action_result keys={list(result.get('action_result', {}).keys())}")
print(f"  correlation_id={result.get('correlation_id')}")

# Check audit logs
print("\nAudit logs:")
with db.get_connection() as conn:
    cursor = conn.cursor()
    cursor.execute("SELECT event_type, ai_reasoning FROM audit_logs WHERE correlation_id=? ORDER BY log_id ASC", (cid,))
    for row in cursor.fetchall():
        print(f"  event={row['event_type']}, ai_reasoning='{row['ai_reasoning']}'")
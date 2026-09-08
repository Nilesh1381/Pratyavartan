import os
import sys
import uuid

# Remove existing db
for f in ['revenue_recovery.db', 'test_revenue_recovery.db']:
    if os.path.exists(f):
        os.remove(f)

import db
import ai_agent

# Set dummy LLM key
os.environ['LLM_API_KEY'] = 'dummy'
os.environ['LLM_BASE_URL'] = 'https://api.groq.com/openai/v1'
os.environ['LLM_MODEL'] = 'llama-3.3-70b-versatile'

db.init_db()

# Test full workflow
pid = f"pay_test_{uuid.uuid4().hex[:6]}"
cid = str(uuid.uuid4())

# Insert payment
result = db.insert_or_ignore_payment(
    payment_id=pid, 
    amount=150000, 
    error_code="insufficient_funds", 
    error_description="Low balance",
    user_contact="9876543210"
)
print(f"insert_or_ignore_payment result: {result}")

# Now process failed payment
diag = ai_agent.process_failed_payment(payment_id=pid, correlation_id=cid)
if diag:
    print(f"process_failed_payment result:")
    print(f"  diagnosis={diag.diagnosis}, scenario={diag.scenario}, action={diag.action}")
    print(f"  reasoning='{diag.reasoning}', confidence={diag.confidence}")
else:
    print("process_failed_payment returned None")

# Check audit logs
print("\nAudit logs for AI_DIAGNOSIS:")
with db.get_connection() as conn:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_logs WHERE event_type='AI_DIAGNOSIS' ORDER BY log_id DESC LIMIT 3")
    rows = cursor.fetchall()
    for row in rows:
        print(f"  log_id={row['log_id']}, payment_id={row['payment_id']}, ai_reasoning='{row['ai_reasoning']}', severity={row['severity']}")
        if row['action_payload']:
            import json
            payload = json.loads(row['action_payload'])
            print(f"    payload reasoning='{payload.get('reasoning', 'MISSING')}', scenario='{payload.get('scenario', 'MISSING')}'")
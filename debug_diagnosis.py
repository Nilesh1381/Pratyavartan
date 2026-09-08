import os
import sys
import uuid

# Remove existing db
for f in ['revenue_recovery.db', 'test_revenue_recovery.db']:
    if os.path.exists(f):
        os.remove(f)

import db
import ai_agent

# Set environment to use heuristic fallback (no LLM needed)
os.environ['LLM_API_KEY'] = 'dummy'
os.environ['LLM_BASE_URL'] = 'https://api.groq.com/openai/v1'
os.environ['LLM_MODEL'] = 'llama-3.3-70b-versatile'

db.init_db()

# Test 1: Direct classify_and_decide call
print("=== TEST 1: classify_and_decide direct ===")
cid = str(uuid.uuid4())
pid = f"pay_test_{uuid.uuid4().hex[:6]}"
db.insert_or_ignore_payment(payment_id=pid, amount=150000, error_code="insufficient_funds", error_description="Low balance")

diag = ai_agent.classify_and_decide(
    error_code="insufficient_funds",
    error_description="Low balance",
    retry_count=0,
    correlation_id=cid,
    payment_id=pid,
    amount_paise=150000
)
print(f"Diagnosis: diagnosis={diag.diagnosis}, scenario={diag.scenario}, action={diag.action}, reasoning='{diag.reasoning}'")

# Test 2: process_failed_payment
print("\n=== TEST 2: process_failed_payment ===")
cid2 = str(uuid.uuid4())
diag2 = ai_agent.process_failed_payment(payment_id=pid, correlation_id=cid2)
if diag2:
    print(f"Diagnosis: diagnosis={diag2.diagnosis}, scenario={diag2.scenario}, action={diag2.action}, reasoning='{diag2.reasoning}'")
else:
    print("Diagnosis returned None")

# Test 3: Check audit logs for AI_DIAGNOSIS event
print("\n=== TEST 3: Check audit logs ===")
with db.get_connection() as conn:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_logs WHERE event_type='AI_DIAGNOSIS' ORDER BY log_id DESC LIMIT 2")
    rows = cursor.fetchall()
    for row in rows:
        print(f"log_id={row['log_id']}, payment_id={row['payment_id']}, ai_reasoning='{row['ai_reasoning']}', severity={row['severity']}")
        if row['action_payload']:
            import json
            payload = json.loads(row['action_payload'])
            print(f"  payload reasoning='{payload.get('reasoning', 'MISSING')}'")
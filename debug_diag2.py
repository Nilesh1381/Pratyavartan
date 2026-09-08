import os
import sys
import uuid

# Remove existing db
for f in ['revenue_recovery.db', 'test_revenue_recovery.db']:
    if os.path.exists(f):
        os.remove(f)

import db
import ai_agent

# Set dummy LLM key - should use heuristic fallback
os.environ['LLM_API_KEY'] = 'dummy'
os.environ['LLM_BASE_URL'] = 'https://api.groq.com/openai/v1'
os.environ['LLM_MODEL'] = 'llama-3.3-70b-versatile'

db.init_db()

pid = f"pay_test_{uuid.uuid4().hex[:6]}"
cid = str(uuid.uuid4())

# Test classify_and_decide with retry_count=0
diag = ai_agent.classify_and_decide(
    error_code="insufficient_funds",
    error_description="Low balance",
    retry_count=0,
    correlation_id=cid,
    payment_id=pid,
    amount_paise=150000
)
print("With dummy LLM key (retry_count=0):")
print(f"  diagnosis={diag.diagnosis}, scenario={diag.scenario}, action={diag.action}")
print(f"  reasoning='{diag.reasoning}'")
print(f"  confidence={diag.confidence}")

# Test with retry_count=2 (should trigger stopping rule)
print("\nWith retry_count=2:")
diag2 = ai_agent.classify_and_decide(
    error_code="insufficient_funds",
    error_description="Low balance",
    retry_count=2,
    correlation_id=cid,
    payment_id=pid,
    amount_paise=150000
)
print(f"  diagnosis={diag2.diagnosis}, scenario={diag2.scenario}, action={diag2.action}")
print(f"  reasoning='{diag2.reasoning}'")
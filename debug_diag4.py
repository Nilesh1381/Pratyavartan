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

# Test various error codes
test_cases = [
    ("insufficient_funds", "Low balance"),
    ("upi_limit_exceeded", "UPI limit"),
    ("gateway_timeout", "Gateway timeout"),
    ("user_cancelled", "User cancelled"),
    ("mandate_autopay_decline", "Mandate decline"),
    ("random_error", "Random error"),
]

print("Testing classify_and_decide with various error codes:\n")
for error_code, desc in test_cases:
    pid = f"pay_test_{uuid.uuid4().hex[:6]}"
    cid = str(uuid.uuid4())
    db.insert_or_ignore_payment(payment_id=pid, amount=100000, error_code=error_code, error_description=desc)
    
    diag = ai_agent.classify_and_decide(
        error_code=error_code,
        error_description=desc,
        retry_count=0,
        correlation_id=cid,
        payment_id=pid,
        amount_paise=100000
    )
    print(f"error_code='{error_code}': diagnosis={diag.diagnosis}, scenario={diag.scenario}, action={diag.action}, reasoning='{diag.reasoning}'")
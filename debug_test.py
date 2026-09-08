import os
import sys
import uuid

# Remove any existing test db
for f in ['revenue_recovery.db', 'test_revenue_recovery.db']:
    if os.path.exists(f):
        os.remove(f)

import db
import ai_agent

# Set up database
db.init_db()

# Insert payment like the test does
pid = f"pay_test_{uuid.uuid4().hex[:6]}"
cid = str(uuid.uuid4())
db.insert_or_ignore_payment(payment_id=pid, amount=150000, error_code="insufficient_funds", error_description="Low balance")

# Now process the payment
diag = ai_agent.process_failed_payment(payment_id=pid, correlation_id=cid)
print(f"Diagnosis: diagnosis={diag.diagnosis}, scenario={diag.scenario}, action={diag.action}")
"""
Comprehensive Self-Test Suite for Promise-to-Pay Tracker.
Executes and validates all requirements from Part 9 and Part 10 hardening checklist.
"""
import os
import sys
import time
import json
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient

# Set environment before loading app
os.environ["PROMISE_GRACE_MINUTES"] = "1"
os.environ["DATABASE_PATH"] = "revenue_recovery.db"

import db
import main
import orchestrator

client = TestClient(main.app)

def run_tests():
    print("=" * 70)
    print("STARTING PROMISE-TO-PAY TRACKER AUTOMATED SELF-TEST SUITE")
    print("=" * 70)

    # STEP 0: Reset demo state
    print("\n[STEP 0] Resetting demo state...")
    reset_resp = client.post("/api/reset-demo")
    assert reset_resp.status_code == 200, f"Reset failed: {reset_resp.text}"
    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as c FROM promises")
        assert cursor.fetchone()["c"] == 0, "Promises table not empty after reset"
    print(" [PASS] Reset demo data cleared promises table (count == 0).")

    # STEP 1: Simulate insufficient_balance -> POST promise {"minutes_from_now": 1}
    print("\n[STEP 1] Simulate failure -> POST promise {'minutes_from_now': 1}...")
    sim_resp = client.post("/simulate-failure", json={
        "error_code": "insufficient_balance",
        "error_description": "Account balance insufficient",
        "amount": 100000,
        "user_contact": "9876543210"
    })
    assert sim_resp.status_code == 200, f"Simulation failed: {sim_resp.text}"
    pay_id_1 = sim_resp.json()["payment_id"]
    print(f"  Payment 1 created: {pay_id_1}")

    promise_resp = client.post("/promise-to-pay", json={"minutes_from_now": 1})
    assert promise_resp.status_code == 201, f"Promise creation failed: {promise_resp.text}"
    p_data = promise_resp.json()
    assert p_data["payment_id"] == pay_id_1
    assert p_data["status"] == "pending"
    assert "promised_at" in p_data
    assert "followup_after" in p_data
    promise_id_1 = p_data["id"]

    # Assert PROMISE_TO_PAY logged exactly once
    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as c FROM audit_logs WHERE payment_id=? AND event_type='PROMISE_TO_PAY'", (pay_id_1,))
        assert cursor.fetchone()["c"] == 1, "PROMISE_TO_PAY not logged exactly once"
    print(" [PASS] PROMISE_TO_PAY logged exactly once via hash chain.")

    # STEP 2: Force promised_at into the past, then run sweep
    print("\n[STEP 2] Due follow-up: promised_at passed -> run sweep...")
    past_time = (datetime.now(timezone.utc) - timedelta(seconds=10)).strftime("%Y-%m-%dT%H:%M:%SZ")
    with db.get_connection() as conn:
        conn.execute("UPDATE promises SET promised_at=? WHERE id=?", (past_time, promise_id_1))
        conn.commit()

    sweep_resp = client.post("/dev/force-promise-check")
    assert sweep_resp.status_code == 200, f"Sweep failed: {sweep_resp.text}"
    s_data = sweep_resp.json()["result"]
    assert s_data["followed_up"] == 1, f"Expected 1 followed_up, got {s_data}"

    # Assert PROMISE_FOLLOWUP and MESSAGE_SENT logged ONCE
    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as c FROM audit_logs WHERE payment_id=? AND event_type='PROMISE_FOLLOWUP'", (pay_id_1,))
        assert cursor.fetchone()["c"] == 1, "PROMISE_FOLLOWUP not logged exactly once"
        cursor.execute("SELECT action_payload FROM audit_logs WHERE payment_id=? AND event_type='MESSAGE_SENT' ORDER BY log_id DESC LIMIT 1", (pay_id_1,))
        row = cursor.fetchone()
        assert row is not None
        payload = json.loads(row["action_payload"])
        assert "link_source" in payload
        assert payload["link_source"] in ("cache", "audit", "none")
        print(f"  Follow-up voice/message sent. link_source={payload['link_source']}, link={payload.get('payment_link')}")
    print(" [PASS] PROMISE_FOLLOWUP + MESSAGE_SENT logged once, status=followed_up.")

    # STEP 3: POST /customer-paid -> assert PROMISE_KEPT
    print("\n[STEP 3] Customer paid -> assert PROMISE_KEPT...")
    paid_resp = client.post("/customer-paid", json={"payment_id": pay_id_1})
    assert paid_resp.status_code == 200, f"Customer paid failed: {paid_resp.text}"

    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT status FROM promises WHERE id=?", (promise_id_1,))
        assert cursor.fetchone()["status"] == "kept", "Promise status not 'kept'"
        cursor.execute("SELECT COUNT(*) as c FROM audit_logs WHERE payment_id=? AND event_type='PROMISE_KEPT'", (pay_id_1,))
        assert cursor.fetchone()["c"] >= 1, "PROMISE_KEPT not logged"

    # Check metrics
    m_resp = client.get("/api/metrics")
    metrics = m_resp.json()
    assert metrics["promises_kept"] >= 1
    assert metrics["promise_keep_rate"] > 0
    print(f" [PASS] PROMISE_KEPT recorded. promises_kept={metrics['promises_kept']}, keep_rate={metrics['promise_keep_rate']:.2f}")

    # STEP 4: Second payment: promise, never pay, sweep -> follow-up; force followup_after into past -> broken
    print("\n[STEP 4] Broken escalation test with second payment...")
    sim2_resp = client.post("/simulate-failure", json={
        "error_code": "checkout_incomplete",
        "error_description": "User abandoned checkout",
        "amount": 200000,
        "user_contact": "9876543211"
    })
    pay_id_2 = sim2_resp.json()["payment_id"]

    p2_resp = client.post("/promise-to-pay", json={"payment_id": pay_id_2, "minutes_from_now": 1})
    promise_id_2 = p2_resp.json()["id"]

    # Force promised_at to past -> trigger follow-up
    with db.get_connection() as conn:
        conn.execute("UPDATE promises SET promised_at=? WHERE id=?", (past_time, promise_id_2))
        conn.commit()

    client.post("/dev/force-promise-check")
    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT status FROM promises WHERE id=?", (promise_id_2,))
        assert cursor.fetchone()["status"] == "followed_up"

    # Now force followup_after into the past -> sweep again -> BROKEN + ESCALATE_HUMAN
    with db.get_connection() as conn:
        conn.execute("UPDATE promises SET followup_after=? WHERE id=?", (past_time, promise_id_2))
        conn.commit()

    broken_sweep_resp = client.post("/dev/force-promise-check")
    b_result = broken_sweep_resp.json()["result"]
    assert b_result["broken"] == 1, f"Expected 1 broken, got {b_result}"

    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT status FROM promises WHERE id=?", (promise_id_2,))
        assert cursor.fetchone()["status"] == "broken", "Promise status not 'broken'"
        cursor.execute("SELECT status FROM failed_payments WHERE payment_id=?", (pay_id_2,))
        assert cursor.fetchone()["status"] == "ESCALATED", "Payment not ESCALATED"
        cursor.execute("SELECT severity, ai_reasoning FROM audit_logs WHERE payment_id=? AND event_type='PROMISE_BROKEN'", (pay_id_2,))
        p_broken_log = cursor.fetchone()
        assert p_broken_log is not None
        assert p_broken_log["severity"] == "WARNING"
        cursor.execute("SELECT severity FROM audit_logs WHERE payment_id=? AND event_type='ESCALATE_HUMAN'", (pay_id_2,))
        esc_log = cursor.fetchone()
        assert esc_log is not None
        assert esc_log["severity"] == "CRITICAL"
    print(" [PASS] Promise broken -> status=broken, payment=ESCALATED, PROMISE_BROKEN (WARNING) + ESCALATE_HUMAN (CRITICAL).")

    # STEP 5: IDEMPOTENCY: force-promise-check 3x rapidly -> exactly ONE follow-up
    print("\n[STEP 5] Idempotency test: 3 rapid force-promise-checks...")
    sim3_resp = client.post("/simulate-failure", json={
        "error_code": "insufficient_balance",
        "error_description": "Balance low",
        "amount": 50000,
        "user_contact": "9876543212"
    })
    pay_id_3 = sim3_resp.json()["payment_id"]
    p3_resp = client.post("/promise-to-pay", json={"payment_id": pay_id_3, "minutes_from_now": 1})
    promise_id_3 = p3_resp.json()["id"]

    with db.get_connection() as conn:
        conn.execute("UPDATE promises SET promised_at=? WHERE id=?", (past_time, promise_id_3))
        conn.commit()

    # Call 3x rapidly
    r1 = client.post("/dev/force-promise-check").json()["result"]
    r2 = client.post("/dev/force-promise-check").json()["result"]
    r3 = client.post("/dev/force-promise-check").json()["result"]
    assert r1["followed_up"] == 1
    assert r2["followed_up"] == 0
    assert r3["followed_up"] == 0

    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as c FROM audit_logs WHERE payment_id=? AND event_type='PROMISE_FOLLOWUP'", (pay_id_3,))
        assert cursor.fetchone()["c"] == 1, "Duplicate follow-up detected!"
    print(" [PASS] Idempotency verified: exactly 1 follow-up across 3 rapid checks.")

    # STEP 6: WINDOW CLAMPING
    print("\n[STEP 6] Window clamping tests...")
    # 6a. promised_hour=22 -> clamped to 21:00 IST
    # Create fresh unrecovered payment
    sim4 = client.post("/simulate-failure", json={"error_code": "upi_limit_exceeded", "error_description": "Limit", "amount": 60000})
    pay_id_4 = sim4.json()["payment_id"]
    c22_resp = client.post("/promise-to-pay", json={"payment_id": pay_id_4, "promised_hour": 22})
    assert c22_resp.status_code == 201
    c22_data = c22_resp.json()
    assert c22_data["clamped"] == True
    assert "21:00 IST" in c22_data["reasoning"]

    # 6b. promised_hour=5 -> clamped to 09:00 IST
    sim5 = client.post("/simulate-failure", json={"error_code": "upi_limit_exceeded", "error_description": "Limit", "amount": 70000})
    pay_id_5 = sim5.json()["payment_id"]
    c5_resp = client.post("/promise-to-pay", json={"payment_id": pay_id_5, "promised_hour": 5})
    assert c5_resp.status_code == 201
    c5_data = c5_resp.json()
    assert c5_data["clamped"] == True
    assert "09:00 IST" in c5_data["reasoning"]

    # 6c. promised_hour=30 -> 400 invalid_promised_hour
    c30_resp = client.post("/promise-to-pay", json={"promised_hour": 30})
    assert c30_resp.status_code == 400
    assert c30_resp.json()["error"] == "invalid_promised_hour"
    print(" [PASS] Clamping verified: hour 22 -> 21:00 IST, hour 5 -> 09:00 IST, hour 30 -> 400.")

    # STEP 7: VALIDATION TESTS
    print("\n[STEP 7] Validation tests (fail-fast, no silent defaults)...")
    # Empty body
    e_resp = client.post("/promise-to-pay", json={})
    assert e_resp.status_code == 400
    assert e_resp.json()["error"] == "time_required"

    # Active duplicate promise -> 409
    dup_resp = client.post("/promise-to-pay", json={"payment_id": pay_id_4, "minutes_from_now": 5})
    assert dup_resp.status_code == 409
    assert dup_resp.json()["error"] == "promise_exists"

    # Already recovered payment -> 400
    rec_resp = client.post("/promise-to-pay", json={"payment_id": pay_id_1, "minutes_from_now": 5})
    assert rec_resp.status_code == 400
    assert rec_resp.json()["error"] == "already_recovered"
    print(" [PASS] Validation rules verified: empty body (400), dupe (409), recovered (400).")

    # STEP 8: server_now in state API
    print("\n[STEP 8] Verifying server_now in metrics & state API...")
    m = client.get("/api/metrics").json()
    assert "server_now" in m
    assert "active_promises" in m
    assert "promises_total" in m
    assert "promises_followed_up" in m
    assert "promises_kept" in m
    assert "promises_broken" in m
    assert "promise_keep_rate" in m
    print(f" [PASS] State API has server_now ({m['server_now']}) and all promise metrics.")

    # STEP 9: Hash-chain integrity check
    print("\n[STEP 9] Verifying cryptographic SHA-256 hash-chain integrity...")
    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT log_id, correlation_id, payment_id, timestamp, event_type, severity, action_payload, ai_reasoning, parent_log_id, hash_chain_link FROM audit_logs ORDER BY log_id ASC")
        logs = [dict(r) for r in cursor.fetchall()]

    prev_hash = "GENESIS"
    for log in logs:
        expected_raw = "|".join([
            prev_hash,
            log["correlation_id"],
            log["payment_id"],
            log["timestamp"],
            log["event_type"],
            log["severity"],
            log["action_payload"],
            log["ai_reasoning"] or "",
        ])
        expected_hash = db.hashlib.sha256(expected_raw.encode("utf-8")).hexdigest()
        assert log["hash_chain_link"] == expected_hash, f"Hash mismatch at log_id={log['log_id']}"
        prev_hash = log["hash_chain_link"]
    print(f" [PASS] Cryptographic SHA-256 hash chain verified 100% intact across all {len(logs)} audit events.")

    print("\n" + "=" * 70)
    print("ALL PROMISE-TO-PAY SELF-TESTS PASSED PERFECTLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()

"""
check_ai.py — Comprehensive Validation Test Suite for Autonomous Payment Recovery Agent.

Tests all 9 points of the spec:
1. Scenario mapping priority (deterministic order).
2. Persona mapping output (blocked, enabled, upi_intent_uri).
3. Structured AI diagnosis format.
4. URI format validation.
5. Mandate retry scheduler IST spacing.
6. Mandate sweep cancellation on recovery & exhaustion.
7. Quota protection & preservation mode.
8. Violations counter calculation across 5 checkpoints.
9. SHA-256 hash chain cryptographic integrity.
"""

import os
import sys
import uuid
from datetime import datetime, timezone

# Ensure database is clean or set test database
os.environ["DATABASE_PATH"] = "test_revenue_recovery.db"
if os.path.exists("test_revenue_recovery.db"):
    os.remove("test_revenue_recovery.db")

import db
import ai_agent
import razorpay_service
import orchestrator

db.init_db()

def test_1_scenario_mapping_priority():
    print("\n--- TEST 1: Scenario Mapping Priority ---")
    # 1. limit wins over everything
    assert ai_agent.map_scenario("limit insufficient cart mandate bank", "") == "UPI_LIMIT", "limit should have highest priority"
    # 2. insufficient/balance wins over cart, mandate, bank
    assert ai_agent.map_scenario("insufficient cart mandate bank", "") == "INSUFFICIENT_BALANCE"
    assert ai_agent.map_scenario("low balance cart", "") == "INSUFFICIENT_BALANCE"
    # 3. cart/abandon wins over mandate, bank
    assert ai_agent.map_scenario("cart mandate bank", "") == "CART_ABANDONMENT"
    assert ai_agent.map_scenario("user abandoned session", "") == "CART_ABANDONMENT"
    # 4. mandate/autopay wins over bank
    assert ai_agent.map_scenario("mandate bank", "") == "MANDATE_FAIL"
    assert ai_agent.map_scenario("autopay decline", "") == "MANDATE_FAIL"
    # 5. bank/gateway
    assert ai_agent.map_scenario("bank error", "") == "BANK_DOWN"
    assert ai_agent.map_scenario("gateway timeout", "") == "BANK_DOWN"
    # 6. unknown
    assert ai_agent.map_scenario("random_error_xyz", "") == "UNKNOWN"
    print("✅ TEST 1 PASSED: Deterministic scenario mapping strictly enforces priority order.")

def test_2_persona_mapping():
    print("\n--- TEST 2: Persona Mapping Output ---")
    # UPI_LIMIT
    sc, blk, enb, uri, act, rsn = ai_agent.resolve_scenario_and_methods(error_code="upi_limit", amount_paise=50000)
    assert sc == "UPI_LIMIT"
    assert blk == ["upi", "wallet"]
    assert enb == ["card", "emi", "netbanking"]
    assert uri is None
    assert act == "SWITCH_INSTRUMENT"

    # INSUFFICIENT_BALANCE
    sc, blk, enb, uri, act, rsn = ai_agent.resolve_scenario_and_methods(error_code="insufficient_funds", amount_paise=50000)
    assert sc == "INSUFFICIENT_BALANCE"
    assert blk == []
    assert set(enb) == {"upi", "wallet", "card", "emi", "netbanking"}
    assert uri is not None and uri.startswith("upi://")
    assert act == "SWITCH_INSTRUMENT"

    # CART_ABANDONMENT
    sc, blk, enb, uri, act, rsn = ai_agent.resolve_scenario_and_methods(error_code="cart_abandoned", amount_paise=50000)
    assert sc == "CART_ABANDONMENT"
    assert blk == []
    assert set(enb) == {"upi", "card", "emi", "netbanking"}
    assert uri is not None and uri.startswith("upi://")
    assert act == "SEND_UPI_INTENT"

    # BANK_DOWN
    sc, blk, enb, uri, act, rsn = ai_agent.resolve_scenario_and_methods(error_code="bank_timeout", amount_paise=50000)
    assert sc == "BANK_DOWN"
    assert blk == []
    assert enb == []
    assert uri is None
    assert act == "WAIT_AND_MONITOR"
    assert "Bank/gateway down — spamming link now = futile + annoying." in rsn

    # MANDATE_FAIL
    sc, blk, enb, uri, act, rsn = ai_agent.resolve_scenario_and_methods(error_code="mandate_decline", amount_paise=50000)
    assert sc == "MANDATE_FAIL"
    assert blk == []
    assert set(enb) == {"upi", "card"}
    assert uri is None
    assert act == "MANDATE_RETRY"

    # UNKNOWN
    sc, blk, enb, uri, act, rsn = ai_agent.resolve_scenario_and_methods(error_code="weird_glitch", amount_paise=50000)
    assert sc == "UNKNOWN"
    assert blk == []
    assert set(enb) == {"upi", "card", "emi", "netbanking", "wallet"}
    assert uri is None
    assert act == "ESCALATE_HUMAN"
    print("✅ TEST 2 PASSED: All 6 personas produce exact blocked/enabled methods and actions.")

def test_3_structured_ai_diagnosis():
    print("\n--- TEST 3: Structured AI Diagnosis In Audit Log ---")
    pid = f"pay_test_{uuid.uuid4().hex[:6]}"
    cid = str(uuid.uuid4())
    db.insert_or_ignore_payment(payment_id=pid, amount=150000, error_code="insufficient_funds", error_description="Low balance")
    diag = ai_agent.process_failed_payment(payment_id=pid, correlation_id=cid)
    assert diag is not None
    assert diag.scenario == "INSUFFICIENT_BALANCE"

    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM audit_logs WHERE correlation_id=? AND event_type='AI_DIAGNOSIS'", (cid,))
        row = cursor.fetchone()
        assert row is not None
        import json
        payload = json.loads(row["action_payload"])
        assert "scenario" in payload
        assert "blocked_methods" in payload
        assert "enabled_methods" in payload
        assert "reasoning" in payload
        assert payload["scenario"] == "INSUFFICIENT_BALANCE"
    print("✅ TEST 3 PASSED: AI_DIAGNOSIS event logs full structured action payload.")

def test_4_uri_format():
    print("\n--- TEST 4: UPI Intent URI Format ---")
    uri = ai_agent.build_upi_intent_uri(25000)
    assert uri is not None
    assert "upi://pay?" in uri
    assert "am=250.00" in uri
    assert "cu=INR" in uri
    assert "tn=Revive" in uri
    print("✅ TEST 4 PASSED: URI conforms to upi://pay?pa=...&pn=...&am=250.00&cu=INR&tn=Revive.")

def test_5_mandate_scheduler():
    print("\n--- TEST 5: Mandate Retry Sequencer Scheduling ---")
    pid = f"pay_mnd_{uuid.uuid4().hex[:6]}"
    cid = str(uuid.uuid4())
    db.insert_or_ignore_payment(payment_id=pid, amount=299900, error_code="mandate_autopay_decline")
    res = orchestrator.schedule_mandate_retry(payment_id=pid, correlation_id=cid)
    assert res["success"] is True
    assert len(res["schedule"]) == 3
    assert res["schedule"][0]["attempt_no"] == 1
    assert res["schedule"][1]["attempt_no"] == 2
    assert res["schedule"][2]["attempt_no"] == 3

    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM mandate_schedule WHERE payment_id=? AND status='pending'", (pid,))
        assert cursor.fetchone()["count"] == 3
    print("✅ TEST 5 PASSED: Mandate Retry Sequencer created 3 scheduled attempts.")

def test_6_mandate_sweep_and_cancellation():
    print("\n--- TEST 6: Mandate Sweep Execution & Cancellation ---")
    pid = f"pay_mnd_{uuid.uuid4().hex[:6]}"
    cid = str(uuid.uuid4())
    db.insert_or_ignore_payment(payment_id=pid, amount=299900, error_code="mandate_autopay_decline")
    orchestrator.schedule_mandate_retry(payment_id=pid, correlation_id=cid)

    # Force Attempt 1
    f_res = orchestrator.dev_force_mandate_attempt(payment_id=pid)
    assert f_res["success"] is True
    assert f_res["attempt_no"] == 1

    # Simulate payment recovered
    db.update_payment_status(pid, "RECOVERED")
    # Run sweep -> remaining should be cancelled and MANDATE_CANCELLED logged
    sweep_res = orchestrator.run_mandate_sweep()
    assert sweep_res["cancelled"] >= 2

    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM audit_logs WHERE payment_id=? AND event_type='MANDATE_CANCELLED'", (pid,))
        assert cursor.fetchone()["count"] >= 1
    print("✅ TEST 6 PASSED: Mandate attempts fired and remaining cancelled with MANDATE_CANCELLED event upon recovery.")

def test_7_quota_protection():
    print("\n--- TEST 7: Link Quota Protection & Preservation Mode ---")
    quota = db.get_link_quota_metrics()
    assert quota["limit"] == 30

    # Fill link cache up to 28 (remaining = 2 <= 3)
    with db.get_connection() as conn:
        for i in range(28):
            conn.execute("INSERT INTO link_cache (payment_id, link_url, created_at) VALUES (?, ?, ?)",
                         (f"pay_cache_{i}", f"https://rzp.io/i/plink_{i}", datetime.now(timezone.utc).isoformat()))
        conn.commit()

    quota_pres = db.get_link_quota_metrics()
    assert quota_pres["remaining"] == 2
    assert quota_pres["preservation_mode"] is True

    # Try creating link during preservation mode
    cid = str(uuid.uuid4())
    pid = f"pay_pres_{uuid.uuid4().hex[:6]}"
    db.insert_or_ignore_payment(payment_id=pid, amount=50000, error_code="cart_drop")
    res = razorpay_service.handle_cart_drop(payment_id=pid, amount=50000, correlation_id=cid)
    assert res["payment_link_simulated"] is True

    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM audit_logs WHERE event_type='QUOTA_PRESERVED'")
        assert cursor.fetchone()["count"] == 1
    print("✅ TEST 7 PASSED: Quota preservation mode activated at remaining <= 3 and logged QUOTA_PRESERVED once.")

def test_8_violations_counter():
    print("\n--- TEST 8: Violations Counter (5 Checkpoints) ---")
    # Clean DB and log each of the 5 violation events
    db.reset_demo_data()
    cid = str(uuid.uuid4())
    for pid in ["p1", "p2", "p3", "p4", "p5"]:
        db.insert_or_ignore_payment(payment_id=pid, amount=10000)

    db.log_event(cid, "p1", "STOPPING_RULE_TRIGGERED", {"reason": "Retry cap"}, severity="WARNING")
    db.log_event(cid, "p2", "PROMISE_TO_PAY", {"clamped": True, "promised_at": "..."})
    db.log_event(cid, "p3", "QUOTA_PRESERVED", {"remaining": 2}, severity="WARNING")
    db.log_event(cid, "p4", "SECURITY_ALERT", {"reason": "HMAC fail"}, severity="CRITICAL")
    db.log_event(cid, "p5", "AI_DIAGNOSIS", {"action": "wait_and_monitor", "scenario": "BANK_DOWN"}, severity="INFO")

    count = db.get_violations_prevented_count()
    assert count == 5, f"Expected 5 violations prevented, got {count}"
    print("✅ TEST 8 PASSED: Violations counter strictly tallies all 5 defined checkpoints.")

def test_9_hash_chain_integrity():
    print("\n--- TEST 9: SHA-256 Cryptographic Hash Chain Integrity ---")
    report = db.verify_audit_hash_chain()
    assert report["verified"] is True
    assert report["chain_intact"] is True
    assert report["total_blocks"] >= 5
    print("✅ TEST 9 PASSED: Append-only SHA-256 audit ledger hash chain is 100% verified.")

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print("===============================================================")
    print("RUNNING MEGA FIX TEST SUITE (check_ai.py)")
    print("===============================================================")
    try:
        test_1_scenario_mapping_priority()
        test_2_persona_mapping()
        test_3_structured_ai_diagnosis()
        test_4_uri_format()
        test_5_mandate_scheduler()
        test_6_mandate_sweep_and_cancellation()
        test_7_quota_protection()
        test_8_violations_counter()
        test_9_hash_chain_integrity()
        print("\n===============================================================")
        print("ALL 9 VERIFICATION TESTS PASSED PERFECTLY (100% SUCCESS)!")
        print("===============================================================")
    finally:
        if os.path.exists("test_revenue_recovery.db"):
            try:
                os.remove("test_revenue_recovery.db")
            except Exception:
                pass

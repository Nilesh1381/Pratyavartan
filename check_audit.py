import sqlite3, glob
db = glob.glob('*.db')[0]
c = sqlite3.connect(db)

print("=== LAST 10 EVENTS ===")
for r in c.execute("SELECT log_id, event_type, severity, substr(hash_chain_link,1,10) FROM audit_logs ORDER BY log_id DESC LIMIT 10"):
    print(r)

print("\n=== LAST 5 ERRORS ===")
for r in c.execute("SELECT log_id, payment_id, action_payload FROM audit_logs WHERE event_type='ERROR' ORDER BY log_id DESC LIMIT 5"):
    print("log", r[0], "pay", r[1])
    print("  ", str(r[2])[:250])

print("\n=== RECOVERY GAP ===")
det = [r[0] for r in c.execute("SELECT payment_id FROM audit_logs WHERE event_type='DETECTED'")]
rec = set(r[0] for r in c.execute("SELECT payment_id FROM audit_logs WHERE event_type='RECOVERED'"))
for p in det:
    print(p, "->", "RECOVERED" if p in rec else "NOT RECOVERED")

print("\n=== CHAIN BASIC ===")
rows = list(c.execute("SELECT log_id, hash_chain_link FROM audit_logs ORDER BY log_id"))
print("total:", len(rows), "| empty chain links:", sum(1 for r in rows if not r[1]))

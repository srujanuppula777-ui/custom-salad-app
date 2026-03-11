from database import engine
import sqlalchemy as sa

with engine.connect() as conn:
    print("Migrating customer table...")
    try:
        conn.execute(sa.text("ALTER TABLE customers ADD COLUMN office_address TEXT"))
        conn.commit()
        print(" -> Added office_address to customers")
    except Exception as e:
        print(" -> Already exists or error:", e)

    print("Migrating subscriptions table...")
    try:
        conn.execute(sa.text("ALTER TABLE subscriptions ADD COLUMN delivery_schedule TEXT"))
        conn.commit()
        print(" -> Added delivery_schedule to subscriptions")
    except Exception as e:
        print(" -> Already exists or error:", e)

print("Migration complete!")

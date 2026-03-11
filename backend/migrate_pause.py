from database import engine
import sqlalchemy as sa

with engine.connect() as conn:
    try:
        conn.execute(sa.text("ALTER TABLE subscriptions ADD COLUMN pause_dates TEXT DEFAULT '[]'"))
        conn.commit()
        print("Migration OK: pause_dates column added")
    except Exception as e:
        print("Already exists or error:", e)

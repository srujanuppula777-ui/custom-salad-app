from database import engine
import sqlalchemy as sa

with engine.connect() as conn:
    print("Migrating customer table...")
    try:
        conn.execute(sa.text("ALTER TABLE customers ADD COLUMN office_google_location TEXT"))
        conn.commit()
        print(" -> Added office_google_location to customers")
    except Exception as e:
        print(" -> Already exists or error:", e)

print("Migration complete!")

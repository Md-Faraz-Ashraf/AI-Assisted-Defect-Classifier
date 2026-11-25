from sqlalchemy.orm import Session

from app.core.config import Settings
from app.db.models import BatchRow, UserRow
from app.db.session import make_engine


def seed() -> None:
    settings = Settings()
    if settings.app_mode != "database":
        raise SystemExit("Set APP_MODE=database before seeding PostgreSQL.")
    engine = make_engine(settings.database_url)
    try:
        with Session(engine) as session, session.begin():
            for row in (
                UserRow(user_id="1", name="Priya", role="QUALITY_ENGINEER"),
                UserRow(user_id="2", name="Rahul", role="PRODUCTION_SUPERVISOR"),
                BatchRow(
                    batch_id="BATCH-001",
                    batch_number="BATCH-001",
                    product_name="Steel Bracket X200",
                    production_line="Line 3",
                ),
                BatchRow(
                    batch_id="BATCH-002",
                    batch_number="BATCH-002",
                    product_name="Plastic Housing P100",
                    production_line="Line 2",
                ),
                BatchRow(
                    batch_id="BATCH-003",
                    batch_number="BATCH-003",
                    product_name="Aluminium Panel A50",
                    production_line="Line 1",
                ),
            ):
                session.merge(row)
        print("Seeded or updated 2 demo users and 3 demo batches (idempotent).")
    finally:
        engine.dispose()


if __name__ == "__main__":
    seed()

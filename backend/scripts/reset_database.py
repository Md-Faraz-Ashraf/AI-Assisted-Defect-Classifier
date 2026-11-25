import argparse

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.db.models import BatchRow, InspectionRow, UserRow
from app.db.session import make_engine


def reset_database(confirmation: str) -> None:
    if confirmation != "RESET-QUALITY-INSPECTION-DATA":
        raise SystemExit("Reset cancelled: supply the exact confirmation phrase.")
    settings = Settings()
    if settings.app_mode != "database":
        raise SystemExit("Set APP_MODE=database before resetting PostgreSQL.")
    engine = make_engine(settings.database_url)
    try:
        with Session(engine) as session, session.begin():
            session.execute(delete(InspectionRow))
            session.execute(delete(BatchRow))
            session.execute(delete(UserRow))
        print(
            "Application rows were deleted. Re-run scripts/seed.py to restore demo users/batches."
        )
    finally:
        engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Destructively clear quality-inspection data.")
    parser.add_argument(
        "--confirm", required=True, help="Must equal the documented confirmation phrase."
    )
    reset_database(parser.parse_args().confirm)

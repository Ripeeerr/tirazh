from pathlib import Path

from sqlalchemy import select

from app.core.config import get_settings
from app.core.database_urls import is_postgres_database
from app.core.security import password_hash
from app.db.models import Base, User
from app.db.session import SessionLocal, engine
from app.seed import seed_catalog


def main():
    url = get_settings().database_url
    if url != "sqlite:///var/e2e.db" and not is_postgres_database(url, "tirazh_e2e"):
        raise SystemExit("E2E seed requires a dedicated tirazh_e2e database")
    Path("var").mkdir(exist_ok=True)
    Base.metadata.create_all(engine)
    seed_catalog()
    with SessionLocal() as db:
        if db.scalar(select(User).where(User.email == "manager@example.com")):
            return
        db.add(
            User(
                email="manager@example.com",
                name="Менеджер",
                role="manager",
                password_hash=password_hash.hash("manager-password"),
            )
        )
        db.commit()


if __name__ == "__main__":
    main()

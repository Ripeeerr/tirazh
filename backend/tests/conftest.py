import os

os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings
from app.core.database_urls import is_postgres_database
from app.core.security import password_hash
from app.db.models import Base, User
from app.db.session import get_db
from app.main import app
from app.seed import seed_catalog


@pytest.fixture
def database(tmp_path, monkeypatch):
    test_url = os.environ.get("TEST_DATABASE_URL")
    if test_url:
        if not is_postgres_database(test_url, "tirazh_test"):
            raise ValueError("TEST_DATABASE_URL must point to the dedicated tirazh_test database")
        engine = create_engine(test_url)
        Base.metadata.drop_all(engine)
    else:
        engine = create_engine(
            "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
        )

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(connection, record):
        if not test_url:
            connection.execute("PRAGMA foreign_keys=ON")

    factory = sessionmaker(bind=engine, expire_on_commit=False)
    Base.metadata.create_all(engine)
    monkeypatch.setattr("app.seed.SessionLocal", factory)
    monkeypatch.setattr(get_settings(), "upload_directory", tmp_path)
    seed_catalog()
    with factory() as db:
        db.add(
            User(
                email="manager@example.com",
                name="Менеджер",
                role="manager",
                password_hash=password_hash.hash("manager-password"),
            )
        )
        db.commit()
    yield factory
    engine.dispose()


@pytest.fixture
def client(database):
    def override():
        with database() as db:
            yield db

    app.dependency_overrides[get_db] = override
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()

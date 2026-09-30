import pytest

from app.core.database_urls import is_postgres_database


@pytest.mark.parametrize("name", ["tirazh_test", "tirazh_e2e"])
def test_only_exact_postgres_database_name_is_allowed(name):
    assert is_postgres_database(f"postgresql+psycopg://localhost/{name}", name)
    assert is_postgres_database(
        f"postgresql+psycopg://localhost/{name}?application_name=tests", name
    )
    assert not is_postgres_database(
        f"postgresql+psycopg://localhost/production?application_name=/{name}", name
    )
    assert not is_postgres_database(f"postgresql+psycopg://localhost/{name}_copy", name)
    assert not is_postgres_database(f"sqlite:///var/{name}", name)
    assert not is_postgres_database("invalid-url", name)

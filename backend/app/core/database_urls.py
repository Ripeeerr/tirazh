from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError


def is_postgres_database(value: str, expected_name: str) -> bool:
    try:
        url = make_url(value)
    except ArgumentError:
        return False
    return url.get_backend_name() == "postgresql" and url.database == expected_name

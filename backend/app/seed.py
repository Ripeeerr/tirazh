import argparse
import getpass

from sqlalchemy import select

from app.core.security import password_hash
from app.db.models import Product, User
from app.db.session import SessionLocal


def seed_catalog():
    with SessionLocal() as db:
        for slug, title, description, base_price, formats in [
            (
                "business-cards",
                "Визитки",
                "Маленький формат. Большое впечатление.",
                8,
                [("standard", "Стандарт", "90 × 50 мм", 1), ("euro", "Евро", "85 × 55 мм", 1.1)],
            ),
            (
                "flyers",
                "Листовки",
                "Ваше предложение — в хороших руках.",
                10,
                [("a6", "A6", "105 × 148 мм", 1), ("a5", "A5", "148 × 210 мм", 1.5)],
            ),
            (
                "booklets",
                "Буклеты",
                "История вашего дела — в одном развороте.",
                24,
                [("a4", "A4", "210 × 297 мм", 1), ("a3", "A3", "297 × 420 мм", 1.8)],
            ),
            (
                "postcards",
                "Открытки",
                "Тёплые слова, которые остаются.",
                12,
                [("a6", "A6", "148 × 105 мм", 1), ("square", "Квадрат", "148 × 148 мм", 1.3)],
            ),
            (
                "posters",
                "Постеры",
                "Ваша идея в большом формате.",
                60,
                [("a3", "A3", "297 × 420 мм", 1), ("a2", "A2", "420 × 594 мм", 1.8)],
            ),
            (
                "invitations",
                "Приглашения",
                "Особый повод начинается с приглашения.",
                18,
                [("a6", "A6", "148 × 105 мм", 1), ("dl", "Евро", "99 × 210 мм", 1.2)],
            ),
        ]:
            if db.get(Product, slug):
                continue
            weight = 170 if slug in {"booklets", "posters"} else 300
            options = {
                "format": [
                    {"value": value, "label": label, "hint": hint, "multiplier": factor}
                    for value, label, hint, factor in formats
                ],
                "paper": [
                    {
                        "value": "standard",
                        "label": "Стандартная",
                        "hint": f"{weight} г/м²",
                        "multiplier": 1,
                    },
                    {
                        "value": "matte",
                        "label": "Матовая",
                        "hint": f"{weight + 50} г/м²",
                        "multiplier": 1.25,
                    },
                    {
                        "value": "textured",
                        "label": "С фактурой",
                        "hint": f"{weight} г/м²",
                        "multiplier": 1.5,
                    },
                ],
                "printing": [
                    {"value": "single", "label": "Односторонняя", "hint": "4+0", "multiplier": 1},
                    {"value": "double", "label": "Двусторонняя", "hint": "4+4", "multiplier": 1.2},
                ],
                "quantities": [10, 25, 50, 100, 250]
                if slug == "posters"
                else [100, 250, 500, 1000, 2000],
            }
            db.add(
                Product(
                    slug=slug,
                    title=title,
                    description=description,
                    base_price=base_price,
                    options=options,
                )
            )
        db.commit()


def create_manager(email: str):
    password = getpass.getpass("Пароль менеджера (от 10 символов): ")
    if len(password) < 10:
        raise SystemExit("Пароль должен содержать минимум 10 символов")
    with SessionLocal() as db:
        if db.scalar(select(User).where(User.email == email.lower())):
            raise SystemExit("Пользователь уже существует")
        db.add(
            User(
                email=email.lower(),
                name="Менеджер типографии",
                role="manager",
                password_hash=password_hash.hash(password),
            )
        )
        db.commit()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--manager", type=str)
    arguments = parser.parse_args()
    seed_catalog()
    if arguments.manager:
        create_manager(arguments.manager)

from decimal import ROUND_HALF_UP, Decimal

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.db.models import Product
from app.modules.schemas import QuoteOut, Specification


def calculate_quote(db: Session, spec: Specification) -> tuple[Product, QuoteOut]:
    product = db.get(Product, spec.product_slug)
    if product is None:
        raise HTTPException(404, "Продукт не найден")
    multiplier = Decimal(1)
    for field in ("format", "paper", "printing"):
        option = next(
            (item for item in product.options[field] if item["value"] == getattr(spec, field)), None
        )
        if option is None:
            raise HTTPException(422, f"Недопустимый параметр: {field}")
        multiplier *= Decimal(str(option["multiplier"]))
    if spec.quantity not in product.options["quantities"]:
        raise HTTPException(422, "Недопустимый тираж")
    volume_factor = Decimal("0.85") if spec.quantity >= 1000 else Decimal(1)
    amount = Decimal(product.base_price) * spec.quantity * multiplier * volume_factor
    price = int(amount.quantize(Decimal(1), rounding=ROUND_HALF_UP))
    return product, QuoteOut(price=price, unit_price=price / spec.quantity, production_days=3)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import manager_user
from app.db.models import Product, User
from app.db.session import get_db
from app.modules.pricing import calculate_quote
from app.modules.schemas import ProductCreate, ProductOut, QuoteOut, Specification

router = APIRouter(tags=["catalog"])


@router.get("/products", response_model=list[ProductOut])
def products(db: Session = Depends(get_db)):
    return db.scalars(select(Product).order_by(Product.slug)).all()


@router.post("/quotes", response_model=QuoteOut)
def quote(payload: Specification, db: Session = Depends(get_db)):
    return calculate_quote(db, payload)[1]


@router.post("/manager/products", response_model=ProductOut, status_code=201)
def create_product(
    payload: ProductCreate, user: User = Depends(manager_user), db: Session = Depends(get_db)
):
    product = Product(**payload.model_dump())
    db.add(product)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(409, "Товар с таким адресом уже существует") from exc
    return product

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.security import current_user, manager_user
from app.db.models import Artwork, Comment, PrintOrder, StatusEvent, User
from app.db.session import get_db
from app.modules.order_policy import TRANSITIONS
from app.modules.pricing import calculate_quote
from app.modules.schemas import (
    CommentCreate,
    CommentOut,
    OrderCreate,
    OrderOut,
    OrderSummary,
    StatusUpdate,
)

router = APIRouter(tags=["orders"])


def find_order(db: Session, order_id: str, user: User, lock: bool = False) -> PrintOrder:
    statement = select(PrintOrder).where(PrintOrder.id == order_id)
    if lock:
        statement = statement.with_for_update()
    order = db.scalar(
        statement.options(
            selectinload(PrintOrder.files),
            selectinload(PrintOrder.comments),
            selectinload(PrintOrder.history),
        )
    )
    if order is None or (user.role != "manager" and order.user_id != user.id):
        raise HTTPException(404, "Заказ не найден")
    return order


@router.post("/orders", response_model=OrderOut, status_code=201)
def create_order(
    payload: OrderCreate, user: User = Depends(current_user), db: Session = Depends(get_db)
):
    product, quote = calculate_quote(db, payload)
    artwork = db.scalar(select(Artwork).where(Artwork.id == payload.artwork_id).with_for_update())
    if artwork is None or artwork.owner_id != user.id:
        raise HTTPException(422, "Загрузите доступный вам макет")
    specification = payload.model_dump(include={"format", "paper", "printing", "quantity"})
    if artwork.order_id is not None:
        existing = find_order(db, artwork.order_id, user)
        same_request = (
            existing.product_slug == payload.product_slug
            and existing.specification == specification
            and existing.contact_name == payload.contact_name
            and existing.contact_phone == payload.contact_phone
            and existing.note == payload.note
        )
        if same_request:
            return existing
        raise HTTPException(409, "Макет уже прикреплён к другому заказу")
    order = PrintOrder(
        user_id=user.id,
        product_slug=product.slug,
        product_title=product.title,
        specification=specification,
        price=quote.price,
        contact_name=payload.contact_name,
        contact_phone=payload.contact_phone,
        note=payload.note,
    )
    db.add(order)
    db.flush()
    artwork.order_id = order.id
    db.add(StatusEvent(order_id=order.id, actor_id=user.id, status="new"))
    db.commit()
    return find_order(db, order.id, user)


@router.get("/orders", response_model=list[OrderSummary])
def list_orders(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    return db.scalars(
        select(PrintOrder)
        .where(PrintOrder.user_id == user.id)
        .order_by(PrintOrder.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()


@router.get("/manager/orders", response_model=list[OrderSummary])
def manager_orders(
    user: User = Depends(manager_user),
    db: Session = Depends(get_db),
    status: str | None = None,
    search: str = Query("", max_length=100),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    statement = select(PrintOrder)
    if status:
        statement = statement.where(PrintOrder.status == status)
    if search:
        statement = statement.where(PrintOrder.id.startswith(search, autoescape=True))
    return db.scalars(
        statement.order_by(PrintOrder.created_at.desc()).offset(offset).limit(limit)
    ).all()


@router.get("/orders/{order_id}", response_model=OrderOut)
def get_order(order_id: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return find_order(db, order_id, user)


@router.post("/orders/{order_id}/comments", response_model=CommentOut, status_code=201)
def add_comment(
    order_id: str,
    payload: CommentCreate,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    order = find_order(db, order_id, user)
    comment = Comment(
        order_id=order.id, author_id=user.id, author_name=user.name, body=payload.body
    )
    db.add(comment)
    db.commit()
    return comment


@router.patch("/orders/{order_id}/status", response_model=OrderOut)
def change_status(
    order_id: str,
    payload: StatusUpdate,
    user: User = Depends(manager_user),
    db: Session = Depends(get_db),
):
    order = find_order(db, order_id, user, lock=True)
    if payload.status not in TRANSITIONS[order.status]:
        raise HTTPException(409, "Недопустимый переход статуса")
    if payload.status in {"cancelled", "revision"} and not payload.reason.strip():
        raise HTTPException(422, "Укажите причину изменения статуса")
    order.status = payload.status
    db.add(
        StatusEvent(
            order_id=order.id,
            actor_id=user.id,
            status=payload.status,
            reason=payload.reason.strip(),
        )
    )
    db.commit()
    db.expire(order)
    return find_order(db, order_id, user)


@router.post("/orders/{order_id}/artwork", response_model=OrderOut)
def replace_artwork(
    order_id: str,
    artwork_id: str,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    order = find_order(db, order_id, user, lock=True)
    if order.status != "revision" or order.user_id != user.id:
        raise HTTPException(409, "Макет можно заменить только при запросе исправлений")
    artwork = db.scalar(select(Artwork).where(Artwork.id == artwork_id).with_for_update())
    if artwork is None or artwork.owner_id != user.id or artwork.order_id is not None:
        raise HTTPException(422, "Макет недоступен")
    artwork.order_id = order.id
    order.status = "review"
    db.add(
        StatusEvent(
            order_id=order.id,
            actor_id=user.id,
            status="review",
            reason="Клиент загрузил новый макет",
        )
    )
    db.commit()
    db.expire(order)
    return find_order(db, order_id, user)

from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import JSON, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def identifier() -> str:
    return str(uuid4())


def now() -> datetime:
    return datetime.now(UTC)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str] = mapped_column(String(30), default="")
    password_hash: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(String(20), default="client")


class AuthSession(Base):
    __tablename__ = "sessions"

    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Product(Base):
    __tablename__ = "products"

    slug: Mapped[str] = mapped_column(String(40), primary_key=True)
    title: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text)
    base_price: Mapped[int] = mapped_column(Integer)
    options: Mapped[dict] = mapped_column(JSON)


class PrintOrder(Base):
    __tablename__ = "orders"
    __table_args__ = (Index("ix_orders_owner_created", "user_id", "created_at"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    product_slug: Mapped[str] = mapped_column(ForeignKey("products.slug"))
    product_title: Mapped[str] = mapped_column(String(100))
    specification: Mapped[dict] = mapped_column(JSON)
    price: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(30), default="new")
    contact_name: Mapped[str] = mapped_column(String(100))
    contact_phone: Mapped[str] = mapped_column(String(30))
    note: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    files: Mapped[list["Artwork"]] = relationship(order_by="Artwork.created_at")
    comments: Mapped[list["Comment"]] = relationship(order_by="Comment.created_at")
    history: Mapped[list["StatusEvent"]] = relationship(order_by="StatusEvent.created_at")


class Artwork(Base):
    __tablename__ = "artworks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    order_id: Mapped[str | None] = mapped_column(ForeignKey("orders.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(100))
    size: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id"), index=True)
    author_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    author_name: Mapped[str] = mapped_column(String(100))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class StatusEvent(Base):
    __tablename__ = "status_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id"), index=True)
    actor_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(30))
    reason: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

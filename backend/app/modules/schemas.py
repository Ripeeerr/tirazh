import re
from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    StringConstraints,
    computed_field,
    field_validator,
    model_validator,
)

from app.modules.order_policy import TRANSITIONS, OrderStatus

PersonName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Credentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower()


class Registration(Credentials):
    name: PersonName


class UserOut(ORMModel):
    id: str
    name: str
    email: str
    phone: str
    role: Literal["client", "manager"]


class ProfileUpdate(BaseModel):
    name: PersonName
    phone: str = Field(max_length=30)


class ProductOption(BaseModel):
    value: str
    label: str
    hint: str
    multiplier: float
    finish: Literal["smooth", "matte", "textured"] | None = None


class ProductOptions(BaseModel):
    format: list[ProductOption]
    paper: list[ProductOption]
    printing: list[ProductOption]
    quantities: list[int]


class ProductOut(ORMModel):
    slug: str
    title: str
    description: str
    base_price: int
    options: ProductOptions


class CatalogOption(ProductOption):
    value: str = Field(min_length=1, max_length=30, pattern=r"^[a-z][a-z0-9-]*$")
    label: PersonName
    hint: str = Field(min_length=1, max_length=100)
    multiplier: float = Field(gt=0, le=10, allow_inf_nan=False)


class CatalogOptions(ProductOptions):
    format: list[CatalogOption] = Field(min_length=1, max_length=8)
    paper: list[CatalogOption] = Field(min_length=1, max_length=8)
    printing: list[CatalogOption] = Field(min_length=1, max_length=4)
    quantities: list[Annotated[int, Field(gt=0, le=10000, strict=True)]] = Field(
        min_length=1, max_length=8
    )

    @model_validator(mode="after")
    def validate_options(self):
        for field in (self.format, self.paper, self.printing):
            if len({option.value for option in field}) != len(field):
                raise ValueError("Коды вариантов должны быть уникальными")
        for option in self.format:
            match = re.fullmatch(r"(\d{1,4}) × (\d{1,4}) мм", option.hint)
            if not match or not all(1 <= int(value) <= 3000 for value in match.groups()):
                raise ValueError("Укажите размеры формата в миллиметрах")
        if len(set(self.quantities)) != len(self.quantities):
            raise ValueError("Тиражи не должны повторяться")
        self.quantities = sorted(self.quantities)
        return self


class ProductCreate(BaseModel):
    slug: str = Field(min_length=2, max_length=40, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    title: PersonName
    description: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=5, max_length=1000)
    ]
    base_price: int = Field(gt=0, le=1000000, strict=True)
    options: CatalogOptions

    @model_validator(mode="after")
    def validate_price_range(self):
        choices = (self.options.format, self.options.paper, self.options.printing)
        for quantity in self.options.quantities:
            lowest = highest = Decimal(self.base_price * quantity)
            if quantity >= 1000:
                lowest *= Decimal("0.85")
                highest *= Decimal("0.85")
            for variants in choices:
                factors = [Decimal(str(choice.multiplier)) for choice in variants]
                lowest *= min(factors)
                highest *= max(factors)
            if lowest < Decimal("0.5"):
                raise ValueError("Минимальная стоимость тиража должна быть не меньше 1 рубля")
            if highest > 2000000000:
                raise ValueError("Сочетание цены и коэффициентов даёт слишком большую стоимость")
        return self


class PrintSettings(BaseModel):
    format: str = Field(max_length=30)
    paper: str = Field(max_length=30)
    printing: str = Field(max_length=30)
    quantity: int = Field(gt=0, le=10000)


class Specification(PrintSettings):
    product_slug: str = Field(max_length=40)


class QuoteOut(BaseModel):
    price: int
    unit_price: float
    production_days: int


class OrderCreate(Specification):
    artwork_id: str
    contact_name: PersonName
    contact_phone: str = Field(min_length=7, max_length=30, pattern=r"^[+\d\s()\-]+$")
    note: str = Field(default="", max_length=2000)

    @field_validator("contact_phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        if sum(character.isdigit() for character in value) < 7:
            raise ValueError("Укажите минимум 7 цифр телефона")
        return value


class ArtworkOut(ORMModel):
    id: str
    name: str
    size: int
    created_at: datetime


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)

    @field_validator("body")
    @classmethod
    def trim_body(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Введите текст комментария")
        return value.strip()


class CommentOut(ORMModel):
    id: str
    author_name: str
    body: str
    created_at: datetime


class StatusUpdate(BaseModel):
    status: OrderStatus
    reason: str = Field(default="", max_length=2000)


class EventOut(ORMModel):
    id: str
    status: OrderStatus
    reason: str
    created_at: datetime


class OrderSummary(ORMModel):
    id: str
    product_slug: str
    product_title: str
    specification: PrintSettings
    price: int
    status: OrderStatus
    contact_name: str
    created_at: datetime


class OrderOut(OrderSummary):
    contact_phone: str
    note: str
    files: list[ArtworkOut]
    comments: list[CommentOut]
    history: list[EventOut]

    @computed_field
    @property
    def allowed_statuses(self) -> list[OrderStatus]:
        return list(TRANSITIONS[self.status])

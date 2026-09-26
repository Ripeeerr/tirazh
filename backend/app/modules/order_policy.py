from typing import Literal

OrderStatus = Literal["new", "review", "revision", "printing", "ready", "completed", "cancelled"]

TRANSITIONS: dict[str, tuple[OrderStatus, ...]] = {
    "new": ("review", "cancelled"),
    "review": ("revision", "printing", "cancelled"),
    "revision": ("review", "cancelled"),
    "printing": ("ready",),
    "ready": ("completed",),
    "completed": (),
    "cancelled": (),
}

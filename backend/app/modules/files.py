from pathlib import Path
from urllib.parse import unquote
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import current_user
from app.db.models import Artwork, PrintOrder, User
from app.db.session import get_db
from app.modules.schemas import ArtworkOut

router = APIRouter(prefix="/files", tags=["files"])
FORMATS = {
    ".pdf": ("application/pdf", b"%PDF-"),
    ".png": ("image/png", b"\x89PNG\r\n\x1a\n"),
    ".jpg": ("image/jpeg", b"\xff\xd8\xff"),
    ".jpeg": ("image/jpeg", b"\xff\xd8\xff"),
}


@router.post("", response_model=ArtworkOut, status_code=201)
async def upload(
    request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)
):
    settings = get_settings()
    name = Path(unquote(request.headers.get("x-filename", "")).replace("\\", "/")).name[:255]
    suffix = Path(name).suffix.lower()
    if suffix not in FORMATS:
        raise HTTPException(422, "Поддерживаются PDF, PNG и JPEG")
    content_type, signature = FORMATS[suffix]
    file_id = str(uuid4())
    settings.upload_directory.mkdir(parents=True, exist_ok=True)
    destination = settings.upload_directory / file_id
    size = 0
    prefix = bytearray()
    try:
        with destination.open("xb") as output:
            async for chunk in request.stream():
                size += len(chunk)
                if size > settings.max_upload_bytes:
                    raise HTTPException(413, "Размер файла не должен превышать 10 МБ")
                if len(prefix) < len(signature):
                    prefix.extend(chunk[: len(signature) - len(prefix)])
                output.write(chunk)
        if not prefix.startswith(signature):
            raise HTTPException(422, "Содержимое файла не соответствует формату")
        artwork = Artwork(
            id=file_id, owner_id=user.id, name=name, content_type=content_type, size=size
        )
        db.add(artwork)
        db.commit()
    except BaseException:
        destination.unlink(missing_ok=True)
        raise
    return artwork


@router.get("/{file_id}")
def download(file_id: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    artwork = db.get(Artwork, file_id)
    if artwork is None:
        raise HTTPException(404, "Файл не найден")
    order = db.get(PrintOrder, artwork.order_id) if artwork.order_id else None
    allowed = artwork.owner_id == user.id or (user.role == "manager" and order is not None)
    if not allowed:
        raise HTTPException(404, "Файл не найден")
    path = get_settings().upload_directory / artwork.id
    if not path.is_file():
        raise HTTPException(404, "Файл не найден")
    return FileResponse(
        path,
        media_type=artwork.content_type,
        filename=artwork.name,
        content_disposition_type="attachment",
        headers={
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "private, no-store",
            "Content-Security-Policy": "sandbox; default-src 'none'",
            "Cross-Origin-Resource-Policy": "same-origin",
        },
    )

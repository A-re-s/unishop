import uuid

import aioboto3
from fastapi import HTTPException, UploadFile, status

from backend.core.config import settings

session = aioboto3.Session()

ALLOWED_CONTENT_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5 MB


def get_s3_client():
    return session.client(
        "s3",
        endpoint_url=settings.minio_endpoint_url,
        aws_access_key_id=settings.minio_root_user,
        aws_secret_access_key=settings.minio_root_password,
    )


def photo_url(object_key: str) -> str:
    return f"{settings.photos_public_base_url}/{object_key}"


async def upload_photo(file: UploadFile, *, prefix: str) -> str:
    """Validate an uploaded image and store it in the bucket. Returns its
    object key (not a URL — see User.avatar_object_key for why)."""
    extension = ALLOWED_CONTENT_TYPES.get(file.content_type or "")
    if extension is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported file type '{file.content_type}'. "
            f"Allowed: {', '.join(ALLOWED_CONTENT_TYPES)}",
        )

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File too large. Max size is {MAX_UPLOAD_SIZE // (1024 * 1024)} MB",
        )

    object_key = f"{prefix}/{uuid.uuid4()}.{extension}"

    async with get_s3_client() as s3:
        await s3.put_object(
            Bucket=settings.minio_bucket,
            Key=object_key,
            Body=contents,
            ContentType=file.content_type,
        )

    return object_key


async def delete_photo(object_key: str) -> None:
    async with get_s3_client() as s3:
        await s3.delete_object(Bucket=settings.minio_bucket, Key=object_key)

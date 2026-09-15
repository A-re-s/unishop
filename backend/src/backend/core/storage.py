import aioboto3

from backend.core.config import settings

session = aioboto3.Session()


def get_s3_client():
    return session.client(
        "s3",
        endpoint_url=settings.minio_endpoint_url,
        aws_access_key_id=settings.minio_root_user,
        aws_secret_access_key=settings.minio_root_password,
    )

# Every model module must be imported here so it registers on Base.metadata —
# Alembic's autogenerate only sees models that have actually been imported.
from backend.db.models.category import Category
from backend.db.models.listing import Listing
from backend.db.models.user import User

__all__ = ["Category", "Listing", "User"]

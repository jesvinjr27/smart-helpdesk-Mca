"""
API Version 1 package.
Exposes router modules for clean package-level imports.
"""

from . import auth
from . import users
from . import organizations
from . import tickets
from . import knowledge
from . import sla
from . import dashboard
from . import admin
from . import health

__all__ = [
    "auth",
    "users",
    "organizations",
    "tickets",
    "knowledge",
    "sla",
    "dashboard",
    "admin",
    "health",
]

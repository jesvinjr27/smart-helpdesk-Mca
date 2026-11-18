from typing import List
from sqlalchemy.orm import Session
from backend.app.models.all_models import Role, UserRole, User

def get_user_roles(user: User, db: Session) -> List[str]:
    """Retrieves list of role names assigned to a user."""
    roles = (
        db.query(Role.name)
        .join(UserRole, UserRole.role_id == Role.id)
        .filter(UserRole.user_id == user.id)
        .all()
    )
    return [r[0] for r in roles]

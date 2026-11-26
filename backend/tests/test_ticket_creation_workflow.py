import io
import pytest
from backend.app.db.session import SessionLocal
from backend.app.models.all_models import Ticket, User, Category, TicketAttachment
from backend.app.schemas.all_schemas import TicketCreate, DuplicateCheckRequest
from backend.app.api.v1.tickets import (
    create_ticket,
    check_duplicate_tickets,
    get_ticket_attachments,
    upload_ticket_attachments,
)
from fastapi import UploadFile


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_duplicate_check_and_creation(db):
    user = db.query(User).filter(User.email == "alice@apex.com").first()
    if not user:
        user = db.query(User).first()

    cat = db.query(Category).first()

    # 1. Test duplicate check with sample query
    dup_req = DuplicateCheckRequest(
        title="Cannot connect to office VPN",
        description="GlobalProtect client gives authentication error 403 when connecting.",
        category_id=cat.id if cat else None
    )
    dup_res = check_duplicate_tickets(dup_req, current_user=user, db=db)
    assert hasattr(dup_res, "has_duplicates")
    assert isinstance(dup_res.duplicates, list)

    # 2. Test ticket creation with structured specifications
    tick_in = TicketCreate(
        title="Modern Smart Ticket Test Incident",
        description="Detailed description with structured attributes.\n\n---\n**Structured Ticket Specifications:**\n• Area: GlobalProtect VPN\n• OS: Windows 11",
        category_id=cat.id,
        priority="HIGH",
        tags=["incident", "vpn", "network"]
    )
    created = create_ticket(tick_in, current_user=user, db=db)
    assert created.id is not None
    assert created.title == "Modern Smart Ticket Test Incident"
    assert created.priority == "HIGH"
    assert "incident" in created.tags

    # Clean up created test ticket
    db_ticket = db.query(Ticket).filter(Ticket.id == created.id).first()
    if db_ticket:
        db.delete(db_ticket)
        db.commit()

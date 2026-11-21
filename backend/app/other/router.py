from fastapi import APIRouter, HTTPException, status

from app.other.repository import create, list_all
from app.other.schemas import ContactCreate, ContactPublic

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.get("", response_model=list[ContactPublic])
def read_contacts() -> list[ContactPublic]:
    return [ContactPublic.from_document(contact) for contact in list_all()]


@router.post("", response_model=ContactPublic, status_code=status.HTTP_201_CREATED)
def create_contact(payload: ContactCreate) -> ContactPublic:
    name = payload.name.strip()
    email = str(payload.email).strip()
    message = payload.message.strip()
    if not name or not message:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Name and message cannot be empty",
        )
    created = create(name=name, email=email, message=message)
    return ContactPublic.from_document(created)
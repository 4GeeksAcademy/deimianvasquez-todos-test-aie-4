from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class ContactCreate(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr
    message: str = Field(min_length=1, max_length=1000)


class ContactPublic(BaseModel):
    id: int
    name: str
    email: EmailStr
    message: str
    created_at: datetime

    @classmethod
    def from_document(cls, document):
        return cls.model_validate({"id": document.doc_id, **document})
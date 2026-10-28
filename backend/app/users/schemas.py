from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=1)


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=1)


class UserPublic(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: Literal["user", "admin"]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_document(cls, document):
        return cls.model_validate({"id": document.doc_id, **document})

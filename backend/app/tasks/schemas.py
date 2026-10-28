from datetime import datetime

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(min_length=1)


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    done: bool | None = None


class TaskPublic(BaseModel):
    id: int
    title: str
    done: bool
    owner_id: int
    created_at: datetime

    @classmethod
    def from_document(cls, document):
        return cls.model_validate({"id": document.doc_id, **document})

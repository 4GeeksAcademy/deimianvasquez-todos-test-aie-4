from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.auth.dependencies import get_current_user
from app.tasks.repository import create, delete, get_for_owner, list_by_owner, update
from app.tasks.schemas import TaskCreate, TaskPublic, TaskUpdate
from app.users.schemas import UserPublic

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _require_owned_task(task_id: int, owner_id: int):
    task = get_for_owner(task_id, owner_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.get("", response_model=list[TaskPublic])
def read_tasks(current_user: UserPublic = Depends(get_current_user)) -> list[TaskPublic]:
    return [TaskPublic.from_document(task) for task in list_by_owner(current_user.id)]


@router.get("/{task_id}", response_model=TaskPublic)
def read_task(
    task_id: int,
    current_user: UserPublic = Depends(get_current_user),
) -> TaskPublic:
    task = _require_owned_task(task_id, current_user.id)
    return TaskPublic.from_document(task)


@router.post("", response_model=TaskPublic, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    current_user: UserPublic = Depends(get_current_user),
) -> TaskPublic:
    title = payload.title.strip()
    if not title:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Title cannot be empty",
        )
    created = create(title=title, owner_id=current_user.id)
    return TaskPublic.from_document(created)


@router.patch("/{task_id}", response_model=TaskPublic)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    current_user: UserPublic = Depends(get_current_user),
) -> TaskPublic:
    _require_owned_task(task_id, current_user.id)
    changes = {
        key: value
        for key, value in payload.model_dump(exclude_unset=True).items()
        if value is not None
    }
    if "title" in changes:
        title = changes["title"].strip()
        if not title:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Title cannot be empty",
            )
        changes["title"] = title

    updated = update(task_id, current_user.id, changes)
    return TaskPublic.from_document(updated)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: UserPublic = Depends(get_current_user),
) -> Response:
    _require_owned_task(task_id, current_user.id)
    delete(task_id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

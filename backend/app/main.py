from datetime import datetime
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .auth import create_access_token, verify_password
from .config import settings
from .db import Base, SessionLocal, engine
from .deps import get_admin_user, get_current_user, get_db

app = FastAPI(title="Problem Trainer API")

origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(models.Topic).count() == 0:
            algebra = models.Topic(name="Algebra")
            geometry = models.Topic(name="Geometry")
            db.add_all([algebra, geometry])
            db.flush()
            db.add_all(
                [
                    models.Problem(
                        number=1,
                        topic_id=algebra.id,
                        rating=1200,
                        statement="Solve for x: 2x + 3 = 11",
                        answer_key="4",
                    ),
                    models.Problem(
                        number=2,
                        topic_id=geometry.id,
                        rating=1200,
                        statement="What is the sum of interior angles of a triangle?",
                        answer_key="180",
                    ),
                ]
            )
            db.commit()
    finally:
        db.close()


@app.post("/auth/signup", response_model=schemas.TokenResponse)
def signup(payload: schemas.SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(
        (models.User.username == payload.username) | (models.User.email == payload.email)
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username or email already exists")

    user = crud.create_user(db, payload.username, payload.email, payload.password)
    token = create_access_token(subject=user.username, is_admin=user.is_admin)
    return schemas.TokenResponse(access_token=token)


@app.post("/auth/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == payload.username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Username incorrect")
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Password does not match")

    token = create_access_token(subject=user.username, is_admin=user.is_admin)
    return schemas.TokenResponse(access_token=token)


@app.get("/topics", response_model=List[schemas.TopicOut])
def list_topics(db: Session = Depends(get_db)):
    return db.query(models.Topic).order_by(models.Topic.name.asc()).all()


@app.get("/problems", response_model=List[schemas.ProblemOut])
def list_problems(topic_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Problem)
    if topic_id:
        query = query.filter(models.Problem.topic_id == topic_id)
    return query.order_by(models.Problem.id.asc()).all()


@app.get("/problems/random", response_model=schemas.ProblemOut)
def random_problem(
    topic_id: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    problem = crud.get_random_problem(db, current_user.id, topic_id)
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="You have solved all problems in that topic")
    crud.set_current_problem(db, current_user.id, problem.id)
    return problem


@app.get("/problems/{problem_id}", response_model=schemas.ProblemOut)
def get_problem(problem_id: int, db: Session = Depends(get_db)):
    problem = db.query(models.Problem).filter(models.Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")
    return problem


@app.post("/problems/{problem_id}/submit", response_model=schemas.SubmissionResponse)
def submit_answer(
    problem_id: int,
    payload: schemas.SubmissionRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    problem = db.query(models.Problem).filter(models.Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")
    submission = crud.create_submission(db, current_user, problem, payload.answer)
    return schemas.SubmissionResponse(is_correct=submission.is_correct)


@app.get("/me", response_model=schemas.ProfileOut)
def get_profile(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    history = (
        db.query(models.Submission)
        .filter(models.Submission.user_id == current_user.id)
        .order_by(models.Submission.created_at.desc())
        .limit(20)
        .all()
    )
    total_solved = (
        db.query(models.Submission)
        .filter(models.Submission.user_id == current_user.id, models.Submission.is_correct == True)
        .count()
    )
    per_topic = crud.get_user_stats(db, current_user.id)

    history_out = [
        schemas.HistoryItem(
            problem_id=item.problem_id,
            is_correct=item.is_correct,
            created_at=item.created_at,
        )
        for item in history
    ]

    return schemas.ProfileOut(
        username=current_user.username,
        rating=current_user.rating,
        total_solved=total_solved,
        per_topic=per_topic,
        history=history_out,
    )


@app.get("/me/current-problem", response_model=schemas.ProblemOut)
def get_current_problem(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    problem = crud.get_current_problem(db, current_user.id)
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No current problem")
    return problem


class CurrentProblemRequest(BaseModel):
    problem_id: int


@app.post("/me/current-problem")
def set_current_problem(
    payload: CurrentProblemRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    problem = db.query(models.Problem).filter(models.Problem.id == payload.problem_id).first()
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")
    crud.set_current_problem(db, current_user.id, problem.id)
    return {"status": "ok"}


@app.post("/proposals", response_model=schemas.ProposalOut)
def submit_proposal(
    payload: schemas.ProposalRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    proposal = crud.create_proposal(db, current_user.id, payload.topic_id, payload.statement, payload.answer_key)
    return proposal


@app.get("/admin/proposals", response_model=List[schemas.ProposalOut])
def list_proposals(
    _: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    return db.query(models.Proposal).order_by(models.Proposal.created_at.desc()).all()


@app.post("/admin/proposals/{proposal_id}/approve", response_model=schemas.ProblemOut)
def approve_proposal(
    proposal_id: int,
    _: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    proposal = db.query(models.Proposal).filter(models.Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")
    problem = crud.approve_proposal(db, proposal)
    return problem

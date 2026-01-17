from datetime import datetime
from typing import Dict, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from .auth import get_password_hash, verify_password
from .models import Problem, Proposal, Submission, Topic, User, UserProblemState


def create_user(db: Session, username: str, email: str, password: str) -> User:
    user = User(username=username, email=email, password_hash=get_password_hash(password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


def get_random_problem(db: Session, user_id: int, topic_id: Optional[int]) -> Optional[Problem]:
    query = text(
        """
        SELECT p.* FROM problems p
        LEFT JOIN submissions s
            ON s.problem_id = p.id
            AND s.user_id = :user_id
            AND s.is_correct = TRUE
        WHERE s.id IS NULL
            AND (:topic_id IS NULL OR p.topic_id = :topic_id)
        ORDER BY RANDOM()
        LIMIT 1
        """
    )
    row = db.execute(query, {"user_id": user_id, "topic_id": topic_id}).mappings().first()
    if not row:
        return None
    return db.query(Problem).get(row["id"])


def set_current_problem(db: Session, user_id: int, problem_id: int) -> None:
    state = db.query(UserProblemState).filter(UserProblemState.user_id == user_id).first()
    if state:
        state.problem_id = problem_id
        state.last_seen_at = datetime.utcnow()
    else:
        state = UserProblemState(user_id=user_id, problem_id=problem_id)
        db.add(state)
    db.commit()


def get_current_problem(db: Session, user_id: int) -> Optional[Problem]:
    state = db.query(UserProblemState).filter(UserProblemState.user_id == user_id).first()
    if not state:
        return None
    return db.query(Problem).filter(Problem.id == state.problem_id).first()


def normalize_answer(answer: str) -> str:
    return " ".join(answer.strip().lower().split())


def create_submission(db: Session, user: User, problem: Problem, answer: str) -> Submission:
    is_correct = normalize_answer(answer) == normalize_answer(problem.answer_key)
    submission = Submission(user_id=user.id, problem_id=problem.id, answer=answer, is_correct=is_correct)
    db.add(submission)

    if is_correct:
        user.rating += 10
        problem.rating += 2
    else:
        user.rating = max(0, user.rating - 5)
        problem.rating = max(0, problem.rating - 1)

    db.commit()
    db.refresh(submission)
    return submission


def create_proposal(db: Session, user_id: int, topic_id: int, statement: str, answer_key: str) -> Proposal:
    proposal = Proposal(
        user_id=user_id,
        topic_id=topic_id,
        statement=statement,
        answer_key=answer_key,
    )
    db.add(proposal)
    db.commit()
    db.refresh(proposal)
    return proposal


def approve_proposal(db: Session, proposal: Proposal) -> Problem:
    problem = Problem(
        number=proposal.id,
        topic_id=proposal.topic_id,
        statement=proposal.statement,
        answer_key=proposal.answer_key,
        rating=1200,
    )
    proposal.status = "approved"
    db.add(problem)
    db.commit()
    db.refresh(problem)
    return problem


def get_user_stats(db: Session, user_id: int) -> Dict[str, int]:
    rows = db.execute(
        text(
            """
            SELECT t.name as topic, COUNT(s.id) as solved
            FROM submissions s
            JOIN problems p ON p.id = s.problem_id
            JOIN topics t ON t.id = p.topic_id
            WHERE s.user_id = :user_id AND s.is_correct = TRUE
            GROUP BY t.name
            """
        ),
        {"user_id": user_id},
    ).mappings()
    return {row["topic"]: row["solved"] for row in rows}

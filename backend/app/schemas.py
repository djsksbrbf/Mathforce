from datetime import datetime
from typing import Dict, List, Optional
from typing import Annotated
import json

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    # allow passwords longer than 72 bytes; we'll pre-hash before bcrypt
    password: Annotated[str, Field(min_length=6)]


class LoginRequest(BaseModel):
    username: str
    password: Annotated[str, Field(min_length=6)]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TopicOut(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class ProblemOut(BaseModel):
    id: int
    number: int
    topic_id: int
    rating: int
    statement: str

    model_config = ConfigDict(from_attributes=True)


class ProblemDetailOut(ProblemOut):
    answer_key: Optional[str] = None


class SubmissionRequest(BaseModel):
    answer: str


class SubmissionResponse(BaseModel):
    is_correct: bool


class HistoryItem(BaseModel):
    problem_id: int
    is_correct: bool
    created_at: datetime


class ProfileOut(BaseModel):
    username: str
    rating: int
    total_solved: int
    per_topic: Dict[str, int]
    history: List[HistoryItem]


class ProposalRequest(BaseModel):
    topic_id: int
    statement: str
    answer_key: str

    @model_validator(mode="before")
    def parse_if_string(cls, v):
        # frontend may accidentally send a JSON-encoded string as the body;
        # accept that by parsing the string into an object before normal validation.
        if isinstance(v, (str, bytes, bytearray)):
            if isinstance(v, (bytes, bytearray)):
                v = v.decode()
            try:
                parsed = json.loads(v)
            except Exception:
                raise ValueError("Invalid JSON string for ProposalRequest")
            if isinstance(parsed, str):
                try:
                    parsed = json.loads(parsed)
                except Exception:
                    pass
            return parsed
        return v


class ProposalOut(BaseModel):
    id: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

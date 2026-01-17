from .db import Base, SessionLocal, engine
from .models import Problem, Topic


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Topic).count() > 0:
            return
        algebra = Topic(name="Algebra")
        geometry = Topic(name="Geometry")
        db.add_all([algebra, geometry])
        db.flush()

        problems = [
            Problem(number=1, topic_id=algebra.id, rating=1200, statement="Solve for x: 2x + 3 = 11", answer_key="4"),
            Problem(number=2, topic_id=geometry.id, rating=1200, statement="What is the sum of interior angles of a triangle?", answer_key="180"),
        ]
        db.add_all(problems)
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    run()

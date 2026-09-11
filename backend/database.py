from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./gap_analyser.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Curriculum(Base):
    __tablename__ = "curriculum"

    curriculum_id = Column(Integer, primary_key=True, index=True)
    course_name = Column(String, nullable=True)
    course_code = Column(String, nullable=True)
    content = Column(Text)
    skills = Column(Text)
    uploaded_date = Column(DateTime, default=datetime.utcnow)


class IndustryRequirementDB(Base):
    __tablename__ = "industry_requirements"

    requirement_id = Column(Integer, primary_key=True, index=True)
    job_title = Column(String)
    company = Column(String, nullable=True)
    required_skills = Column(Text)
    preferred_skills = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    source = Column(String, nullable=True)
    uploaded_date = Column(DateTime, default=datetime.utcnow)


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    analysis_id = Column(Integer, primary_key=True, index=True)
    curriculum_id = Column(Integer, ForeignKey("curriculum.curriculum_id"))
    requirement_id = Column(Integer, ForeignKey("industry_requirements.requirement_id"))
    matched_skills = Column(Text)
    missing_skills = Column(Text)
    coverage_percentage = Column(Float)
    analysis_date = Column(DateTime, default=datetime.utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
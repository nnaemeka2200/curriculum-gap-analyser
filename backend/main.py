from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os
import json
import PyPDF2
import docx

from database import init_db, get_db, Curriculum, IndustryRequirementDB, AnalysisResult

app = FastAPI()

init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://curriculum-gap-analyser-frontend-ai.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"

KNOWN_SKILLS = [
    "python", "java", "c++", "c#", "javascript", "typescript", "php", "ruby", "go", "swift", "kotlin",
    "html", "css", "react", "angular", "vue", "node.js", "express", "django", "flask", "spring boot",
    "sql", "mysql", "postgresql", "mongodb", "sqlite", "oracle", "redis", "firebase",
    "git", "github", "docker", "kubernetes", "aws", "azure", "google cloud", "linux", "bash",
    "rest api", "graphql", "microservices", "agile", "scrum", "devops", "ci/cd",
    "machine learning", "deep learning", "data science", "data analysis", "artificial intelligence",
    "tensorflow", "pytorch", "pandas", "numpy", "scikit-learn", "nlp",
    "networking", "cybersecurity", "cryptography", "operating systems", "database design",
    "software engineering", "object-oriented programming", "data structures", "algorithms",
    "unit testing", "debugging", "system design", "cloud computing", "big data",
    "excel", "power bi", "tableau", "project management", "communication", "problem solving",
    "rust", "laravel", "figma", "adobe xd", "ui/ux design", "wordpress", "shopify",
    "matlab", "r programming", "sas", "spss", "hadoop", "spark", "kafka", "elasticsearch",
    "jenkins", "terraform", "ansible", "nginx", "apache", "rabbitmq", "graphql api",
    "android development", "ios development", "flutter", "react native", "xamarin",
    "blockchain", "solidity", "web3", "iot", "embedded systems", "assembly language",
    "compiler design", "computer architecture", "distributed systems", "parallel computing",
    "software testing", "test automation", "selenium", "jira", "confluence", "trello",
    "digital marketing", "seo", "technical writing", "public speaking", "teamwork",
    "critical thinking", "time management", "leadership",
]


class IndustryRequirement(BaseModel):
    jobTitle: str
    company: Optional[str] = None
    requiredSkills: List[str]
    preferredSkills: List[str] = []
    description: Optional[str] = ""
    source: Optional[str] = "Manual entry"


def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with open(file_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            text += page.extract_text() or ""
    return text


def extract_text_from_docx(file_path: str) -> str:
    doc = docx.Document(file_path)
    return "\n".join(paragraph.text for paragraph in doc.paragraphs)


def extract_text_from_txt(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()


def extract_skills(text: str) -> list[str]:
    text_lower = text.lower()
    found_skills = []
    for skill in KNOWN_SKILLS:
        if skill in text_lower:
            found_skills.append(skill)
    return found_skills


@app.get("/")
def read_root():
    return {"message": "Curriculum Gap Analyser backend is running"}


@app.post("/upload")
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    filename = file.filename
    extension = filename.split(".")[-1].lower()

    if extension not in ["pdf", "docx", "txt"]:
        raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF, DOCX, or TXT.")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    if extension == "pdf":
        extracted_text = extract_text_from_pdf(file_path)
    elif extension == "docx":
        extracted_text = extract_text_from_docx(file_path)
    else:
        extracted_text = extract_text_from_txt(file_path)

    skills_found = extract_skills(extracted_text)

    curriculum_record = Curriculum(
        course_name=filename,
        content=extracted_text,
        skills=json.dumps(skills_found),
    )
    db.add(curriculum_record)
    db.commit()
    db.refresh(curriculum_record)

    return {
        "curriculum_id": curriculum_record.curriculum_id,
        "filename": filename,
        "extracted_text": extracted_text,
        "character_count": len(extracted_text),
        "skills_found": skills_found,
        "skills_count": len(skills_found),
    }


@app.post("/upload-industry-requirement")
async def upload_industry_requirement(file: UploadFile = File(...), db: Session = Depends(get_db)):
    filename = file.filename
    extension = filename.split(".")[-1].lower()

    if extension not in ["pdf", "docx", "txt"]:
        raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF, DOCX, or TXT.")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    if extension == "pdf":
        extracted_text = extract_text_from_pdf(file_path)
    elif extension == "docx":
        extracted_text = extract_text_from_docx(file_path)
    else:
        extracted_text = extract_text_from_txt(file_path)

    skills_found = extract_skills(extracted_text)

    requirement_record = IndustryRequirementDB(
        job_title=filename,
        required_skills=json.dumps(skills_found),
        description=extracted_text,
        source="File upload",
    )
    db.add(requirement_record)
    db.commit()
    db.refresh(requirement_record)

    return {
        "requirement_id": requirement_record.requirement_id,
        "filename": filename,
        "extracted_text": extracted_text,
        "character_count": len(extracted_text),
        "skills_found": skills_found,
        "skills_count": len(skills_found),
    }


@app.post("/industry-requirement")
def add_industry_requirement(requirement: IndustryRequirement, db: Session = Depends(get_db)):
    requirement_record = IndustryRequirementDB(
        job_title=requirement.jobTitle,
        company=requirement.company,
        required_skills=json.dumps(requirement.requiredSkills),
        preferred_skills=json.dumps(requirement.preferredSkills),
        description=requirement.description,
        source=requirement.source,
    )
    db.add(requirement_record)
    db.commit()
    db.refresh(requirement_record)

    return {
        "message": "Industry requirement saved",
        "requirement_id": requirement_record.requirement_id,
        "data": requirement,
    }


@app.post("/extract-skills")
def extract_skills_endpoint(payload: dict):
    text = payload.get("text", "")
    skills = extract_skills(text)
    return {
        "skills_found": skills,
        "count": len(skills),
    }


@app.post("/gap-analysis")
def gap_analysis(payload: dict, db: Session = Depends(get_db)):
    curriculum_skills = set(s.lower() for s in payload.get("curriculum_skills", []))
    required_skills = set(s.lower() for s in payload.get("required_skills", []))

    matched_skills = list(curriculum_skills & required_skills)
    missing_skills = list(required_skills - curriculum_skills)

    if len(required_skills) > 0:
        coverage_percentage = round((len(matched_skills) / len(required_skills)) * 100, 1)
    else:
        coverage_percentage = 0

    recommendations = [
        f"Consider adding '{skill}' to the curriculum to better meet industry demand."
        for skill in missing_skills
    ]

    curriculum_id = payload.get("curriculum_id")
    requirement_id = payload.get("requirement_id")

    analysis_id = None
    if curriculum_id and requirement_id:
        analysis_record = AnalysisResult(
            curriculum_id=curriculum_id,
            requirement_id=requirement_id,
            matched_skills=json.dumps(matched_skills),
            missing_skills=json.dumps(missing_skills),
            coverage_percentage=coverage_percentage,
        )
        db.add(analysis_record)
        db.commit()
        db.refresh(analysis_record)
        analysis_id = analysis_record.analysis_id

    return {
        "analysis_id": analysis_id,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "coverage_percentage": coverage_percentage,
        "recommendations": recommendations,
    }
@app.post("/gap-analysis-tfidf")
def gap_analysis_tfidf(payload: dict):
    curriculum_text = payload.get("curriculum_text", "")
    job_text = payload.get("job_text", "")

    if not curriculum_text.strip() or not job_text.strip():
        return {
            "similarity_score": 0,
            "message": "Both curriculum_text and job_text are required.",
        }

    documents = [curriculum_text, job_text]

    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf_matrix = vectorizer.fit_transform(documents)

    similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    similarity_percentage = round(similarity * 100, 1)

    return {
        "similarity_score": round(float(similarity), 4),
        "similarity_percentage": similarity_percentage,
    }
"""
Database models for the Boarding AI Backoffice.
"""
import json
from datetime import datetime, timezone
from app.database import db


def utcnow():
    return datetime.now(timezone.utc)


class Company(db.Model):
    __tablename__ = "companies"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    industry = db.Column(db.String(100), nullable=True)
    location = db.Column(db.String(200), nullable=True)
    description = db.Column(db.Text, nullable=True)
    logo_url = db.Column(db.String(500), nullable=True)
    website = db.Column(db.String(300), nullable=True)
    # Job description / requirements stored as JSON
    job_requirements = db.Column(db.Text, nullable=True)  # JSON string
    required_skills = db.Column(db.Text, nullable=True)   # JSON array string
    min_experience_years = db.Column(db.Float, default=0)
    created_at = db.Column(db.DateTime, default=utcnow)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    candidates = db.relationship("Candidate", back_populates="company", cascade="all, delete-orphan")

    @property
    def required_skills_list(self):
        if self.required_skills:
            return json.loads(self.required_skills)
        return []

    @required_skills_list.setter
    def required_skills_list(self, value):
        self.required_skills = json.dumps(value)

    @property
    def job_requirements_dict(self):
        if self.job_requirements:
            return json.loads(self.job_requirements)
        return {}

    @job_requirements_dict.setter
    def job_requirements_dict(self, value):
        self.job_requirements = json.dumps(value)

    def to_dict(self, include_candidates=False):
        data = {
            "id": self.id,
            "name": self.name,
            "industry": self.industry,
            "location": self.location,
            "description": self.description,
            "logo_url": self.logo_url,
            "website": self.website,
            "job_requirements": self.job_requirements_dict,
            "required_skills": self.required_skills_list,
            "min_experience_years": self.min_experience_years,
            "candidate_count": len(self.candidates),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_candidates:
            data["candidates"] = [c.to_dict() for c in self.candidates]
        return data


class Candidate(db.Model):
    __tablename__ = "candidates"

    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("companies.id"), nullable=False)

    # Personal info
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    photo_url = db.Column(db.String(500), nullable=True)

    # CV files
    cv_filename = db.Column(db.String(300), nullable=True)
    cv_path = db.Column(db.String(500), nullable=True)

    # AI Analysis results (rich paragraph-based JSON)
    ai_analysis = db.Column(db.Text, nullable=True)       # Full JSON analysis
    compatibility_score = db.Column(db.Float, nullable=True)
    risk_level = db.Column(db.String(20), nullable=True)  # Low / Medium / High
    experience_years = db.Column(db.Float, nullable=True)
    education_level = db.Column(db.String(100), nullable=True)

    # Processing state
    status = db.Column(db.String(30), default="pending")  # pending / processing / done / error
    error_message = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=utcnow)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    company = db.relationship("Company", back_populates="candidates")

    @property
    def ai_analysis_dict(self):
        if self.ai_analysis:
            return json.loads(self.ai_analysis)
        return {}

    @ai_analysis_dict.setter
    def ai_analysis_dict(self, value):
        self.ai_analysis = json.dumps(value, ensure_ascii=False)

    def to_dict(self, include_analysis=False):
        data = {
            "id": self.id,
            "company_id": self.company_id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "photo_url": self.photo_url,
            "cv_filename": self.cv_filename,
            "compatibility_score": self.compatibility_score,
            "risk_level": self.risk_level,
            "experience_years": self.experience_years,
            "education_level": self.education_level,
            "status": self.status,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_analysis:
            data["ai_analysis"] = self.ai_analysis_dict
        return data


class AppSettings(db.Model):
    """Key-value settings table for runtime configuration."""
    __tablename__ = "app_settings"

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=True)
    description = db.Column(db.String(300), nullable=True)
    category = db.Column(db.String(50), default="general")  # general / ai / matching / ui
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "key": self.key,
            "value": self.value,
            "description": self.description,
            "category": self.category,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @staticmethod
    def get(key, default=None):
        row = AppSettings.query.filter_by(key=key).first()
        return row.value if row else default

    @staticmethod
    def set(key, value, description=None, category="general"):
        row = AppSettings.query.filter_by(key=key).first()
        if row:
            row.value = value
            if description:
                row.description = description
        else:
            row = AppSettings(key=key, value=value, description=description, category=category)
            db.session.add(row)
        db.session.commit()
        return row

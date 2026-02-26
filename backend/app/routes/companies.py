from flask import Blueprint, jsonify, request
from app.database import db
from app.models import Company

companies_bp = Blueprint("companies", __name__, url_prefix="/api/companies")


@companies_bp.route("", methods=["GET"])
def list_companies():
    """List all companies."""
    companies = Company.query.order_by(Company.created_at.desc()).all()
    return jsonify([c.to_dict() for c in companies])


@companies_bp.route("/<int:company_id>", methods=["GET"])
def get_company(company_id):
    """Get a single company with its candidates."""
    company = Company.query.get_or_404(company_id)
    return jsonify(company.to_dict(include_candidates=True))


@companies_bp.route("", methods=["POST"])
def create_company():
    """Create a new company."""
    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"error": "Company name is required"}), 400

    company = Company(
        name=data["name"],
        industry=data.get("industry"),
        location=data.get("location"),
        description=data.get("description"),
        logo_url=data.get("logo_url"),
        website=data.get("website"),
        min_experience_years=data.get("min_experience_years", 0),
    )
    if data.get("required_skills"):
        company.required_skills_list = data["required_skills"]
    if data.get("job_requirements"):
        company.job_requirements_dict = data["job_requirements"]

    db.session.add(company)
    db.session.commit()
    return jsonify(company.to_dict()), 201


@companies_bp.route("/<int:company_id>", methods=["PUT"])
def update_company(company_id):
    """Update a company."""
    company = Company.query.get_or_404(company_id)
    data = request.get_json()

    for field in ["name", "industry", "location", "description", "logo_url", "website"]:
        if field in data:
            setattr(company, field, data[field])
    if "min_experience_years" in data:
        company.min_experience_years = float(data["min_experience_years"])
    if "required_skills" in data:
        company.required_skills_list = data["required_skills"]
    if "job_requirements" in data:
        company.job_requirements_dict = data["job_requirements"]

    db.session.commit()
    return jsonify(company.to_dict())


@companies_bp.route("/<int:company_id>", methods=["DELETE"])
def delete_company(company_id):
    """Delete a company and all its candidates."""
    company = Company.query.get_or_404(company_id)
    db.session.delete(company)
    db.session.commit()
    return jsonify({"message": "Company deleted"}), 200

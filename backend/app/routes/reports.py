from flask import Blueprint, jsonify, make_response, request
from app.models import Candidate, Company
from app.services.report_generator import (
    generate_candidate_pdf,
    generate_company_pdf,
    generate_candidates_csv,
)

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


@reports_bp.route("/candidates/<int:candidate_id>/pdf", methods=["GET"])
def candidate_pdf(candidate_id):
    """Download PDF report for a single candidate."""
    candidate = Candidate.query.get_or_404(candidate_id)
    company = Company.query.get(candidate.company_id) or {}
    company_dict = company.to_dict() if hasattr(company, "to_dict") else {}
    pdf_bytes = generate_candidate_pdf(candidate.to_dict(include_analysis=True), company_dict)
    response = make_response(pdf_bytes)
    response.headers["Content-Type"] = "application/pdf"
    response.headers["Content-Disposition"] = (
        f'attachment; filename="candidate_{candidate_id}_report.pdf"'
    )
    return response


@reports_bp.route("/companies/<int:company_id>/pdf", methods=["GET"])
def company_pdf(company_id):
    """Download summary PDF report for all candidates in a company."""
    company = Company.query.get_or_404(company_id)
    candidates = [c.to_dict() for c in company.candidates]
    pdf_bytes = generate_company_pdf(company.to_dict(), candidates)
    response = make_response(pdf_bytes)
    response.headers["Content-Type"] = "application/pdf"
    response.headers["Content-Disposition"] = (
        f'attachment; filename="company_{company_id}_candidates.pdf"'
    )
    return response


@reports_bp.route("/companies/<int:company_id>/csv", methods=["GET"])
def company_csv(company_id):
    """Download CSV export for all candidates in a company."""
    company = Company.query.get_or_404(company_id)
    candidates = [c.to_dict() for c in company.candidates]
    csv_bytes = generate_candidates_csv(candidates)
    response = make_response(csv_bytes)
    response.headers["Content-Type"] = "text/csv; charset=utf-8"
    response.headers["Content-Disposition"] = (
        f'attachment; filename="company_{company_id}_candidates.csv"'
    )
    return response


@reports_bp.route("/candidates/csv", methods=["GET"])
def all_candidates_csv():
    """Download CSV for all candidates (optionally filtered by company_id)."""
    company_id = request.args.get("company_id", type=int)
    query = Candidate.query
    if company_id:
        query = query.filter_by(company_id=company_id)
    candidates = [c.to_dict() for c in query.all()]
    csv_bytes = generate_candidates_csv(candidates)
    response = make_response(csv_bytes)
    response.headers["Content-Type"] = "text/csv; charset=utf-8"
    response.headers["Content-Disposition"] = 'attachment; filename="candidates.csv"'
    return response

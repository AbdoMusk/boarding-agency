import os
import threading
from pathlib import Path

from flask import Blueprint, jsonify, request, current_app, send_file

from app.database import db
from app.models import Candidate, Company
from app.services.cv_parser import parse_cv_file
from app.config import ACTIVE_CONFIG as cfg

candidates_bp = Blueprint("candidates", __name__, url_prefix="/api/candidates")

ALLOWED_EXTENSIONS = {"pdf"}


def _allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _process_candidate_async(app, candidate_id: int, pdf_path: str,
                              required_skills: list, min_experience: float):
    """Background thread: run CV parsing and update the candidate record."""
    with app.app_context():
        candidate = Candidate.query.get(candidate_id)
        if not candidate:
            return
        try:
            candidate.status = "processing"
            db.session.commit()

            analysis = parse_cv_file(
                pdf_path=pdf_path,
                required_skills=required_skills,
                min_experience=min_experience,
                images_folder=cfg.IMAGES_FOLDER,
            )

            candidate.ai_analysis_dict = analysis
            candidate.compatibility_score = analysis.get("compatibility_score")
            candidate.risk_level = analysis.get("risk_level")
            candidate.experience_years = analysis.get("experience_years")
            candidate.education_level = analysis.get("education_level")
            candidate.name = analysis.get("name") or candidate.name
            candidate.email = analysis.get("email") or candidate.email
            candidate.phone = analysis.get("phone") or candidate.phone
            candidate.status = "done"
            db.session.commit()

        except Exception as exc:
            candidate.status = "error"
            candidate.error_message = str(exc)
            db.session.commit()


# ── Routes ─────────────────────────────────────────────────────────────────────

@candidates_bp.route("", methods=["GET"])
def list_candidates():
    """List all candidates, optionally filtered by company_id."""
    company_id = request.args.get("company_id", type=int)
    query = Candidate.query
    if company_id:
        query = query.filter_by(company_id=company_id)
    candidates = query.order_by(Candidate.created_at.desc()).all()
    return jsonify([c.to_dict() for c in candidates])


@candidates_bp.route("/<int:candidate_id>", methods=["GET"])
def get_candidate(candidate_id):
    """Get a single candidate with full AI analysis."""
    candidate = Candidate.query.get_or_404(candidate_id)
    return jsonify(candidate.to_dict(include_analysis=True))


@candidates_bp.route("", methods=["POST"])
def create_candidate():
    """
    Create a candidate and optionally upload + process their CV.
    Accepts multipart/form-data:
      - company_id (required)
      - name (required)
      - email, phone (optional)
      - cv (file, optional – PDF)
    """
    company_id = request.form.get("company_id", type=int)
    name = request.form.get("name", "").strip()

    if not company_id:
        return jsonify({"error": "company_id is required"}), 400
    if not name:
        return jsonify({"error": "name is required"}), 400

    company = Company.query.get_or_404(company_id)

    candidate = Candidate(
        company_id=company_id,
        name=name,
        email=request.form.get("email"),
        phone=request.form.get("phone"),
        status="pending",
    )
    db.session.add(candidate)
    db.session.flush()  # get id before commit

    # Handle CV upload
    pdf_path = None
    if "cv" in request.files:
        file = request.files["cv"]
        if file and _allowed_file(file.filename):
            os.makedirs(cfg.UPLOAD_FOLDER, exist_ok=True)
            filename = f"candidate_{candidate.id}_{Path(file.filename).name}"
            pdf_path = os.path.join(cfg.UPLOAD_FOLDER, filename)
            file.save(pdf_path)
            candidate.cv_filename = filename
            candidate.cv_path = pdf_path

    db.session.commit()

    # Kick off async processing if we have a CV
    if pdf_path:
        required_skills = company.required_skills_list or cfg.DEFAULT_REQUIRED_SKILLS
        min_exp = company.min_experience_years or cfg.DEFAULT_MIN_EXPERIENCE
        app = current_app._get_current_object()
        thread = threading.Thread(
            target=_process_candidate_async,
            args=(app, candidate.id, pdf_path, required_skills, min_exp),
            daemon=True,
        )
        thread.start()

    return jsonify(candidate.to_dict()), 201


@candidates_bp.route("/<int:candidate_id>/reprocess", methods=["POST"])
def reprocess_candidate(candidate_id):
    """Re-run CV analysis for a candidate (e.g. after changing the LLM provider)."""
    candidate = Candidate.query.get_or_404(candidate_id)
    if not candidate.cv_path or not os.path.exists(candidate.cv_path):
        return jsonify({"error": "No CV file found for this candidate"}), 400

    company = Company.query.get(candidate.company_id)
    required_skills = (company.required_skills_list if company else None) or cfg.DEFAULT_REQUIRED_SKILLS
    min_exp = (company.min_experience_years if company else None) or cfg.DEFAULT_MIN_EXPERIENCE

    app = current_app._get_current_object()
    thread = threading.Thread(
        target=_process_candidate_async,
        args=(app, candidate.id, candidate.cv_path, required_skills, min_exp),
        daemon=True,
    )
    thread.start()

    return jsonify({"message": "Reprocessing started", "status": "processing"})


@candidates_bp.route("/<int:candidate_id>", methods=["PUT"])
def update_candidate(candidate_id):
    """Update candidate metadata (not CV)."""
    candidate = Candidate.query.get_or_404(candidate_id)
    data = request.get_json()
    for field in ["name", "email", "phone", "photo_url"]:
        if field in data:
            setattr(candidate, field, data[field])
    db.session.commit()
    return jsonify(candidate.to_dict())


@candidates_bp.route("/<int:candidate_id>", methods=["DELETE"])
def delete_candidate(candidate_id):
    """Delete a candidate record."""
    candidate = Candidate.query.get_or_404(candidate_id)
    db.session.delete(candidate)
    db.session.commit()
    return jsonify({"message": "Candidate deleted"})


@candidates_bp.route("/<int:candidate_id>/cv", methods=["GET"])
def download_cv(candidate_id):
    """Serve the raw CV PDF."""
    try:
        candidate = Candidate.query.get_or_404(candidate_id)
        if not candidate.cv_path or not os.path.exists(candidate.cv_path):
            return jsonify({"error": "CV file not found"}), 404
        
        # Normalize path and serve with send_file
        filepath = os.path.normpath(os.path.abspath(candidate.cv_path))
        return send_file(filepath, mimetype="application/pdf", as_attachment=False)
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to download CV: {str(e)}"}), 500

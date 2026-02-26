"""
Flask application factory.
"""
import os
from flask import Flask, jsonify
from flask_cors import CORS

from app.config import ACTIVE_CONFIG as cfg
from app.database import init_db
from app.routes.companies import companies_bp
from app.routes.candidates import candidates_bp
from app.routes.reports import reports_bp
from app.routes.settings import settings_bp


def create_app() -> Flask:
    app = Flask(__name__)

    # ── Config ─────────────────────────────────────────────────────────────
    app.config["SECRET_KEY"] = cfg.SECRET_KEY
    app.config["DEBUG"] = cfg.DEBUG
    app.config["SQLALCHEMY_DATABASE_URI"] = cfg.DATABASE_URL
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["MAX_CONTENT_LENGTH"] = cfg.MAX_CONTENT_LENGTH

    # ── CORS ───────────────────────────────────────────────────────────────
    CORS(app, origins=cfg.CORS_ORIGINS, supports_credentials=True)

    # ── Database ───────────────────────────────────────────────────────────
    init_db(app)

    # ── Blueprints ─────────────────────────────────────────────────────────
    app.register_blueprint(companies_bp)
    app.register_blueprint(candidates_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(settings_bp)

    # ── Health check ───────────────────────────────────────────────────────
    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "Boarding AI Backoffice"})

    # ── Global error handlers ──────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": str(e)}), 400

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error", "detail": str(e)}), 500

    # ── Ensure upload directories exist ────────────────────────────────────
    for folder in [cfg.UPLOAD_FOLDER, cfg.IMAGES_FOLDER, cfg.OUTPUTS_FOLDER]:
        os.makedirs(folder, exist_ok=True)

    return app

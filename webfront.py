"""Public site plumbing: contact configuration, robots, sitemap, errors.

Keeping this separate from the learning APIs makes the deployment surface easy
to audit: one file controls what the outside world sees.
"""
from __future__ import annotations

import os

from flask import Flask, Response, jsonify, redirect, render_template, request

from mailer import public_base, reset_configured

# Sections that are reachable through the hash router. The server redirects
# direct visits to the same path so links remain shareable even though routing
# happens in the browser.
HASH_SECTIONS = {
    "ladder", "cosmos", "memory", "living", "lab", "sound", "challenge",
    "archive", "account", "help", "privacy", "terms", "cookies", "disclaimer",
    "copyright", "contact", "data",
}

# The interface uses hash routing, so every section shares one document URL.
# Listing "/#/privacy" in a sitemap would describe the same page as "/", which
# search engines ignore or treat as a duplicate. The sitemap therefore lists the
# canonical document only; section-level discovery happens through the page.


def contact_email() -> str:
    return (os.environ.get("HANZI_CONTACT_EMAIL") or "").strip()


def public_root() -> str:
    return (public_base() or request.url_root).rstrip("/")


def init_site(app: Flask) -> None:
    @app.route("/api/site")
    def site_info():
        return jsonify({
            "name": "Lowkey Mandarin",
            "contactEmail": contact_email(),
            "wordCount": app.config.get("HANZI_WORD_COUNT", 0),
            "hashRouting": True,
            "emailConfigured": reset_configured(),
        })

    @app.route("/robots.txt")
    def robots():
        lines = [
            "User-agent: *",
            "Allow: /",
            "Disallow: /api/",
            f"Sitemap: {public_root()}/sitemap.xml",
            "",
        ]
        return Response("\n".join(lines), mimetype="text/plain")

    @app.route("/sitemap.xml")
    def sitemap():
        root = public_root()
        body = ['<?xml version="1.0" encoding="UTF-8"?>',
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
                f"  <url><loc>{root}/</loc></url>",
                "</urlset>"]
        return Response("\n".join(body), mimetype="application/xml")

    @app.route("/<section>")
    def hash_redirect(section: str):
        if section in HASH_SECTIONS:
            return redirect(f"/#/{section}", code=301)
        return render_template("error.html", code=404, message="That page is not part of the archive."), 404

    @app.errorhandler(404)
    def not_found(error):
        if request.path.startswith("/api/"):
            return jsonify({"error": "Not found"}), 404
        return render_template("error.html", code=404, message="That page is not part of the archive."), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        if request.path.startswith("/api/"):
            return jsonify({"error": "Method not allowed"}), 405
        return render_template("error.html", code=405, message="That action is not allowed here."), 405

    @app.errorhandler(413)
    def request_too_large(error):
        if request.path.startswith("/api/"):
            return jsonify({"error": "That request is too large."}), 413
        return render_template("error.html", code=413, message="That request is too large."), 413

    @app.errorhandler(500)
    def server_error(error):  # pragma: no cover - defensive path
        if request.path.startswith("/api/"):
            return jsonify({"error": "The archive could not complete that request."}), 500
        return render_template("error.html", code=500, message="The archive could not complete that request."), 500

    # Jinja helper so the shell can expose the configured contact address.
    app.jinja_env.globals["contact_email"] = contact_email
    app.jinja_env.globals["site_root"] = public_root


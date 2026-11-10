"""Vercel entry point.

Vercel imports ``app`` from this module as the WSGI application. Everything
else (templates, static files, the API) is handled by the Flask app itself.

Storage is PostgreSQL on serverless: ``DATABASE_URL`` must be set in the
project environment, because the deployment filesystem is read-only and
per-instance. ``database.py`` refuses to write accounts to ephemeral storage
unless ``HANZI_ALLOW_EPHEMERAL=1`` is set for a throwaway demo.
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app  # noqa: E402

__all__ = ["app"]

"""Legacy Vercel function entry point.

Vercel's Flask preset uses ``app.py`` at the repository root, which is the
supported configuration in ``vercel.json``. This module stays for projects that
were created before the preset existed: importing it still exposes a WSGI
``app``. Do not add a catch-all rewrite to it; that makes the function receive
the rewritten path instead of the visitor's path.
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app  # noqa: E402

__all__ = ["app"]

# Lowkey Mandarin production image.
# The SQLite database lives on a mounted volume at /data, never inside the
# image layer. One process, several threads: the in-process rate limiter and
# SQLite are sized for a single small deployment.

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HANZI_DB=/data/hanzi.db \
    PORT=8000

WORKDIR /app

COPY requirements.txt ./
RUN python -m pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd --create-home --uid 10001 hanzi \
    && mkdir -p /data \
    && chown -R hanzi:hanzi /app /data
USER hanzi

VOLUME ["/data"]
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=3)"

CMD ["waitress-serve", "--listen=0.0.0.0:8000", "--threads=4", "--no-clear-untrusted-proxy-headers", "--ident=hanzi-flow", "wsgi:app"]

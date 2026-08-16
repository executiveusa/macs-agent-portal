FROM python:3.13-slim

WORKDIR /app
COPY services/second-brain-worker/worker.py /app/worker.py
RUN useradd --create-home --uid 10001 maxx && mkdir -p /data/maxx && chown -R maxx:maxx /app /data/maxx
USER maxx

CMD ["python", "-u", "/app/worker.py"]

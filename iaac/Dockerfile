FROM registry.access.redhat.com/ubi9/python-311:latest

USER 0
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src/ ./src/
RUN mkdir -p /data/git && chown -R 1001:0 /data && chmod -R g+rwX /data

USER 1001
ENV PYTHONPATH=/app/src
ENV GIT_CLONE_PATH=/data/git/tenancy_repo
CMD ["python3", "/app/src/main.py"]

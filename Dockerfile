# Build stage
FROM python:3.12 AS builder

WORKDIR /app

# Install pip-tools
RUN pip install pip-tools

# Copy requirements file
COPY requirements.in .

# Generate requirements.txt and install dependencies
RUN pip-compile requirements.in && pip-sync

# Final stage
FROM python:3.12-slim

WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy your application code
COPY . .
COPY alembic.ini /app/alembic.ini

# Ensure run_migrations.py is in the correct location
COPY ./run_migrations.py .

# Copy and set permissions for the entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]

# Set the command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

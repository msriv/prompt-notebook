#!/bin/sh
set -e

# Run database migrations
python3 /app/run_migrations.py

# Start Supervisor
exec "$@"

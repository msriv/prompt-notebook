#!/bin/sh
set -e

# Debugging: Check if run_migrations.py exists
if [ -f "/app/run_migrations.py" ]; then
    echo "run_migrations.py found"
else
    echo "run_migrations.py not found"
fi

# Run database migrations
python /app/run_migrations.py

# Execute the main command
exec "$@"

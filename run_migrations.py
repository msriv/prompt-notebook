import os
import sys
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError

# Set the working directory to /app
os.chdir('/app')
print(f"Current working directory: {os.getcwd()}")

# Adjust the path if necessary
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import Base
from app.models import prompt, version, tag  # Import all your models here

def check_and_run_migrations():
    alembic_ini_path = os.path.join(os.getcwd(), 'alembic.ini')
    print(f"Looking for alembic.ini at: {alembic_ini_path}")

    if not os.path.exists(alembic_ini_path):
        print(f"alembic.ini not found at {alembic_ini_path}")
        print("Contents of current directory:")
        print(os.listdir(os.getcwd()))
        sys.exit(1)

    print("Contents of alembic.ini:")
    with open(alembic_ini_path, 'r') as f:
        print(f.read())

    alembic_cfg = Config(alembic_ini_path)

    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL environment variable is not set.")
        sys.exit(1)

    print(f"Using database URL: {db_url}")
    alembic_cfg.set_main_option('sqlalchemy.url', db_url)

    try:
        print("Checking current database revision...")
        command.current(alembic_cfg)

        print("Upgrading database to head revision...")
        command.upgrade(alembic_cfg, "head")
        print("Migrations applied successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    check_and_run_migrations()

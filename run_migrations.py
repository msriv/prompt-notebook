import os
import sys
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError

# Set the working directory to /app
os.chdir('/app')
print(f"Current working directory: {os.getcwd()}")

# Adjust the path if necessary
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import Base
from app.models import prompt, version, tag, project  # Import all your models here

def ensure_tables_exist(engine):
    inspector = inspect(engine)
    if not inspector.has_table("projects"):
        print("Creating 'projects' table...")
        Base.metadata.create_all(engine, tables=[project.Project.__table__])
    else:
        print("'projects' table already exists.")

def create_default_project(db_url):
    engine = create_engine(db_url)
    ensure_tables_exist(engine)

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Check if any project exists
        existing_project = db.query(project.Project).first()
        if not existing_project:
            # Create a default project
            default_project = project.Project(name="Default Project", slug="default-project", description="Default project created by the Prompt Notebook to get started.")
            db.add(default_project)
            db.commit()
            print("Default project created successfully.")
        else:
            print("A project already exists. No need to create a default one.")
    except Exception as e:
        print(f"An error occurred while creating the default project: {e}")
        db.rollback()
    finally:
        db.close()

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

        # Ensure tables exist and create default project after migrations
        create_default_project(db_url)

    except Exception as e:
        print(f"An error occurred: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    check_and_run_migrations()

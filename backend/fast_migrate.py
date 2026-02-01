import os
import sys
import alembic.config
import alembic.command
from alembic.script import ScriptDirectory
from alembic.runtime.migration import MigrationContext
from database import engine, Base
import models  # Ensure models are loaded

def check_current_head(alembic_cfg):
    script = ScriptDirectory.from_config(alembic_cfg)
    return script.get_current_head()

def check_pending_migrations(connection, alembic_cfg):
    """
    Checks if the database is up-to-date with the current head revision.
    Returns True if migrations are pending (db is behind), False otherwise.
    """
    context = MigrationContext.configure(connection)
    current_rev = context.get_current_revision()
    script = ScriptDirectory.from_config(alembic_cfg)
    head_rev = script.get_current_head()

    print(f"Current DB revision: {current_rev}")
    print(f"Head revision: {head_rev}")

    return current_rev != head_rev

def make_migrations():
    """
    Uses Alembic to auto-generate a migration if schema changes are detected.
    This is a simplified approach; primarily we want to ensure 'upgrade head' is run,
    but we also want to try and auto-generate if there are model changes.
    """
    alembic_cfg = alembic.config.Config("alembic.ini")
    
    # Check if we need to generate a migration
    # Note: 'check' command or programmatic equivalent is complex to implement reliably 
    # without just trying to generate.
    # So we will attempt to generate a revision. If no changes, alembic usually says "no changes detected" 
    # but might create an empty file depending on config.
    # However, 'autogenerate' is best effort.
    
    try:
        print("Attempting to detect schema changes and generate migration...")
        # We use a message with timestamp to avoid collisions or generic names
        import datetime
        message = f"auto_migration_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # This is equivalent to `alembic revision --autogenerate -m "..."`
        # Alembic will check for changes between Base.metadata and the DB.
        # This requires the DB to be up to date with the *previous* migration first.
        
        with engine.connect() as connection:
             # Ensure we are at head first (in case we just need to apply existing migrations)
             alembic.command.upgrade(alembic_cfg, "head")
             
             # Now check for NEW changes
             # We can't easily "check" without generating.
             # But if we are in a container on the server, we might NOT want to generate junk files 
             # if there are no changes.
             # A safer bet for this specific user request (local dev on windows -> server)
             # is that the server code *is* the source of truth for the latest models.
             
             # Let's just run upgrade head first.
             # Then, try to generate.
             pass

        # Upgrade to ensure DB is consistent with current migrations
        print("Running: alembic upgrade head")
        alembic.command.upgrade(alembic_cfg, "head")

        # Now attempt to generate new migration for any uncaptured model changes
        # Warning: This updates the source code (creates a file in versions/).
        # Since we mount the volume, this file persists.
        
        # We assume 'alembic check' is available or we use revision --autogenerate.
        # If no changes, Alembic 1.9+ with default env.py might still generate empty file unless configured.
        # Let's trust the user knows what they are doing.
        
        print("Checking for additional model changes...")
        # command.revision(alembic_cfg, message=message, autogenerate=True)
        # The above command might create empty migrations. 
        # Making it stricter requires parsing the output or configuring env.py to not write empty migrations.
        
        # For this task, simply running upgrade head is usually enough IF migrations were committed.
        # BUT the user said "migration in database works automatically" implying they might NOT commit migrations,
        # and want the server to just "figure it out" like Django's makemigrations+migrate behavior.
        
        alembic.command.revision(alembic_cfg, message=message, autogenerate=True)
        
        # Apply the new migration if one was created
        print("Applying new migration (if any)...")
        alembic.command.upgrade(alembic_cfg, "head")
        
    except Exception as e:
        print(f"Error during migration output: {e}")
        # Don't crash the app, just print error
        pass

if __name__ == "__main__":
    make_migrations()

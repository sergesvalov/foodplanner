import pytest
import sys
import os
import time

def generate_report(exit_code):
    report_path = "report.md"
    
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# Automated Test Report\n\n")
        f.write(f"**Date:** {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"**Status:** {'✅ PASSED' if exit_code == 0 else '❌ FAILED'}\n\n")
        
        f.write("## Execution Log\n\n")
        f.write("```text\n")
        # In a real scenario we'd capture stdout/stderr, but for now 
        # we rely on the container logs for details and just mark status here.
        # To make it better, we can read a log file if we redirected output.
        if os.path.exists("pytest.log"):
            with open("pytest.log", "r", encoding="utf-8") as log_file:
                f.write(log_file.read())
        else:
            f.write("No detailed log captured.\n")
        f.write("\n```\n")

    print(f"\n[INFO] Report generated at {report_path}")
    print("---------------------------------------------------")
    with open(report_path, "r", encoding="utf-8") as f:
        print(f.read())
    print("---------------------------------------------------")

if __name__ == "__main__":
    # Run pytest and redirect output to a file
    with open("pytest.log", "w", encoding="utf-8") as log_file:
        # We use subprocess or just pipe sys.stdout? 
        # Simpler to just run pytest.main and capture typically requires plugins.
        # Let's use os.system for simplicity of redirection without complex python IO capture 
        # since pytest captures its own stdout.
        pass
    
    # We will run pytest as a subprocess to easily capture output to file
    import subprocess
    
    print("Starting tests...")
    result = subprocess.run(
        ["pytest", "-v", "tests/"], 
        capture_output=True, 
        text=True
    )
    
    # Write log
    with open("pytest.log", "w", encoding="utf-8") as f:
        f.write(result.stdout)
        if result.stderr:
            f.write("\n--- STDERR ---\n")
            f.write(result.stderr)
            
    generate_report(result.returncode)
    sys.exit(result.returncode)

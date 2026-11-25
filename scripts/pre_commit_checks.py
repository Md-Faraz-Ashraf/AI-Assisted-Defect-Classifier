"""Run the full repository quality and dependency security gate before commits."""

from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"


def backend_python() -> Path:
    if os.name == "nt":
        candidate = BACKEND / ".venv" / "Scripts" / "python.exe"
    else:
        candidate = BACKEND / ".venv" / "bin" / "python"
    if not candidate.is_file():
        raise SystemExit(
            "Backend virtual environment not found. Follow the README setup, then install "
            'backend development dependencies with `python -m pip install -e ".[dev]"`.'
        )
    return candidate


def npm_command() -> str:
    command = "npm.cmd" if os.name == "nt" else "npm"
    resolved = shutil.which(command)
    if not resolved:
        raise SystemExit(
            "npm was not found on PATH. Install Node.js and npm as described in README."
        )
    return resolved


def tracked_backend_tests() -> list[str]:
    result = subprocess.run(
        ["git", "ls-files", "--cached", "--", "backend/tests"],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode:
        raise SystemExit("Could not list tracked backend tests for the pre-commit suite.")
    tests = [
        str(Path(path).relative_to("backend"))
        for path in result.stdout.splitlines()
        if Path(path).name.startswith("test_") and Path(path).suffix == ".py"
    ]
    if not tests:
        raise SystemExit("No tracked backend test files were found.")
    return tests


def staged_python_files() -> list[str]:
    result = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR"],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode:
        raise SystemExit("Could not list staged Python files for formatting and lint checks.")
    files = []
    for path in result.stdout.splitlines():
        if not path.endswith(".py"):
            continue
        if path.startswith("backend/"):
            files.append(str(Path(path).relative_to("backend")))
        elif path.startswith("scripts/"):
            files.append(f"../{path}")
    return files


def run(
    label: str,
    command: list[str],
    cwd: Path,
    *,
    env: dict[str, str] | None = None,
) -> None:
    print(f"\n=== {label} ===", flush=True)
    result = subprocess.run(command, cwd=cwd, check=False, env=env)
    if result.returncode:
        raise SystemExit(result.returncode)


def main() -> None:
    python = str(backend_python())
    npm = npm_command()
    backend_tests = tracked_backend_tests()
    staged_python = staged_python_files()
    backend_test_env = os.environ.copy()
    backend_test_env.update(APP_ENV="test", APP_MODE="mock", AI_PROVIDER="mock")
    audit_cache = BACKEND / "var" / "pip-audit-cache"
    audit_cache.mkdir(parents=True, exist_ok=True)
    checks = [
        ("Frontend dependency audit", [npm, "audit", "--audit-level=moderate"], FRONTEND),
        (
            "Backend dependency audit",
            [
                python,
                "-m",
                "pip_audit",
                "--local",
                "--skip-editable",
                "--cache-dir",
                str(audit_cache),
                "--progress-spinner",
                "off",
            ],
            BACKEND,
        ),
        ("Frontend unit tests", [npm, "test", "--", "--run"], FRONTEND),
        ("Backend unit tests", [python, "-m", "pytest", *backend_tests], BACKEND),
        ("Frontend type check", [npm, "run", "typecheck"], FRONTEND),
        ("Frontend lint", [npm, "run", "lint"], FRONTEND),
        ("Frontend format check", [npm, "run", "format:check"], FRONTEND),
        (
            "Backend lint",
            [python, "-m", "ruff", "check", ".", *staged_python],
            BACKEND,
        ),
        ("Backend type check", [python, "-m", "mypy", "app"], BACKEND),
    ]
    for label, command, cwd in checks:
        run(label, command, cwd, env=backend_test_env if label == "Backend unit tests" else None)
    if staged_python:
        run(
            "Backend format check",
            [python, "-m", "ruff", "format", "--check", *staged_python],
            BACKEND,
        )
    else:
        print("\n=== Backend format check ===\nNo staged Python files to format-check.", flush=True)
    print("\nAll pre-commit checks passed.", flush=True)


if __name__ == "__main__":
    main()

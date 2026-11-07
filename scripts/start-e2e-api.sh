set -eu
cd "$(dirname "$0")/../backend"
export DATABASE_URL="${E2E_DATABASE_URL:-sqlite:///var/e2e.db}"
export FRONTEND_ORIGIN=http://localhost:5174
export UPLOAD_DIRECTORY=var/e2e-uploads
uv run python -m app.e2e_seed
exec uv run uvicorn app.main:app --host 127.0.0.1 --port 8001

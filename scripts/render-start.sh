#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python backend/manage.py migrate --noinput
if [[ -n "${HOTEL_BOOTSTRAP_ADMIN_PASSWORD:-}" ]]; then
  python backend/manage.py bootstrap_admin
fi
exec gunicorn --chdir backend --config backend/gunicorn.conf.py config.wsgi:application

#!/usr/bin/env bash
set -Eeuo pipefail

APP_NAME="token-eco"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

SERVICE_NAME="${TOKEN_ECO_SERVICE:-token-eco}"
DB_PATH="${TOKEN_ECO_DB:-${REPO_DIR}/data/token-eco.sqlite}"
BACKUP_DIR="${TOKEN_ECO_BACKUP_DIR:-${REPO_DIR}/data/backups}"
HEALTH_URL="${TOKEN_ECO_HEALTH_URL:-http://127.0.0.1:${PORT:-8787}/kids}"
HEALTH_ATTEMPTS="${TOKEN_ECO_HEALTH_ATTEMPTS:-20}"
HEALTH_SLEEP_SECONDS="${TOKEN_ECO_HEALTH_SLEEP_SECONDS:-1}"

log() {
  printf '[%s] %s\n' "${APP_NAME}" "$*"
}

fail() {
  printf '[%s] ERROR: %s\n' "${APP_NAME}" "$*" >&2
  exit 1
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

ensure_clean_worktree() {
  if [[ "${TOKEN_ECO_ALLOW_DIRTY:-0}" == "1" ]]; then
    log "Skipping clean worktree check because TOKEN_ECO_ALLOW_DIRTY=1"
    return
  fi

  if [[ -n "$(git status --porcelain)" ]]; then
    git status --short
    fail "Working tree is not clean. Commit/stash changes first, or set TOKEN_ECO_ALLOW_DIRTY=1."
  fi
}

backup_sqlite() {
  if [[ ! -f "${DB_PATH}" ]]; then
    log "SQLite database not found at ${DB_PATH}; skipping backup"
    return
  fi

  mkdir -p "${BACKUP_DIR}"
  local stamp
  stamp="$(date '+%Y%m%d-%H%M%S')"
  local backup_path="${BACKUP_DIR}/token-eco-${stamp}.sqlite"

  cp "${DB_PATH}" "${backup_path}"
  log "Backed up SQLite database to ${backup_path}"
}

update_source() {
  local branch
  branch="$(git symbolic-ref --short HEAD 2>/dev/null || true)"
  if [[ -z "${branch}" ]]; then
    fail "Repository is not on a branch."
  fi

  log "Fetching latest source for ${branch}"
  git fetch --prune

  local upstream
  upstream="$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)"
  if [[ -z "${upstream}" ]]; then
    fail "Branch ${branch} has no upstream. Set it with: git branch --set-upstream-to origin/${branch}"
  fi

  git pull --ff-only
}

install_and_build() {
  if [[ -f package-lock.json ]]; then
    log "Installing dependencies with npm ci"
    npm ci
  else
    log "Installing dependencies with npm install"
    npm install
  fi

  log "Building production assets"
  npm run build
}

service_exists() {
  local unit="$1"
  systemctl list-unit-files --type=service --no-legend 2>/dev/null | awk '{print $1}' | grep -qx "${unit}"
}

user_service_exists() {
  local unit="$1"
  systemctl --user list-unit-files --type=service --no-legend 2>/dev/null | awk '{print $1}' | grep -qx "${unit}"
}

restart_app() {
  if [[ -n "${TOKEN_ECO_RESTART_CMD:-}" ]]; then
    log "Restarting with TOKEN_ECO_RESTART_CMD"
    bash -lc "${TOKEN_ECO_RESTART_CMD}"
    return
  fi

  if ! command_exists systemctl; then
    log "systemctl not found; restart skipped. Set TOKEN_ECO_RESTART_CMD to restart manually."
    return
  fi

  local unit="${SERVICE_NAME}.service"
  if service_exists "${unit}"; then
    log "Restarting system service ${unit}"
    sudo systemctl restart "${unit}"
    sudo systemctl is-active --quiet "${unit}"
    return
  fi

  if user_service_exists "${unit}"; then
    log "Restarting user service ${unit}"
    systemctl --user restart "${unit}"
    systemctl --user is-active --quiet "${unit}"
    return
  fi

  log "No ${unit} service found; restart skipped. Set TOKEN_ECO_SERVICE or TOKEN_ECO_RESTART_CMD."
}

check_health() {
  if ! command_exists curl; then
    log "curl not found; health check skipped"
    return
  fi

  log "Checking ${HEALTH_URL}"
  for attempt in $(seq 1 "${HEALTH_ATTEMPTS}"); do
    if curl -fsS --max-time 3 "${HEALTH_URL}" >/dev/null; then
      log "Health check passed"
      return
    fi

    if [[ "${attempt}" != "${HEALTH_ATTEMPTS}" ]]; then
      sleep "${HEALTH_SLEEP_SECONDS}"
    fi
  done

  if command_exists systemctl; then
    local unit="${SERVICE_NAME}.service"
    log "Recent ${unit} logs:"
    sudo systemctl --no-pager --full status "${unit}" || true
    sudo journalctl -u "${unit}" -n 40 --no-pager || true
  fi

  fail "Health check failed after ${HEALTH_ATTEMPTS} attempts. Check TOKEN_ECO_HEALTH_URL, PORT, and service logs."
}

main() {
  cd "${REPO_DIR}"

  command_exists git || fail "git is required"
  command_exists npm || fail "npm is required"

  ensure_clean_worktree
  backup_sqlite
  update_source
  install_and_build
  restart_app
  check_health

  log "Update completed"
}

main "$@"

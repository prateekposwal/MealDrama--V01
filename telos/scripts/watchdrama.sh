#!/bin/zsh
# Mealdrama server supervisor — run in the FOREGROUND so launchd owns the server
# process directly (KeepAlive restarts it on crash; RunAtLoad starts at boot).
# A subprocess/background child would be torn down when this script exits.
# Manual use: ./watchdrama.sh   (blocks while the server runs)

SERVER_LOG=/tmp/mealdrama_server.log
WATCHDOG_LOG=/tmp/mealdrama_watchdog.log
WORKDIR=/Users/prateekposwal/MD-App

# launchd PATH is minimal (/usr/bin:/bin:/usr/sbin:/sbin) — npm lives under
# /usr/local/bin (symlink into ~/.nvm). Export an explicit PATH so the managed
# server and its child processes resolve npm/node regardless of how we launch.
export PATH="/usr/local/bin:/Users/prateekposwal/.nvm/versions/node/v24.12.0/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export NVM_BIN="/Users/prateekposwal/.nvm/versions/node/v24.12.0/bin"

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') $*" >> "$WATCHDOG_LOG"; }

is_server_up() {
  curl -s -m 3 -o /dev/null -w "%{http_code}" http://localhost:3001/health | grep -q 200
}

log "supervisor start (foreground)"
if is_server_up; then
  log "server already healthy — exiting (launchd KeepAlive will re-arm if it dies)"
  exit 0
fi

# Not running → take over as the server process itself.
cd "$WORKDIR" || exit 1
log "starting npm run server (exec — launchd owns this pid)"
exec npm run server >> "$SERVER_LOG" 2>&1
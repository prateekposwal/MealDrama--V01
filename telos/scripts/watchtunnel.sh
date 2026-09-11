#!/bin/zsh
# MealDrama cloudflare tunnel supervisor — run in the FOREGROUND so launchd owns
# the cloudflared process directly (KeepAlive restarts it on crash; RunAtLoad
# starts at boot). A background child would be torn down when this script exits.
# Manual use: ./watchtunnel.sh   (blocks while cloudflared runs)
#
# NOTE: NO "already running" guard (unlike watchdrama.sh). A quick-tunnel slug
# is assigned per-process and dies with it, so a guard that exits when another
# cloudflared is alive would leave the tunnel unsupervised forever. Each launchd
# restart gets a FRESH slug — the durable answer is a named tunnel (fixed
# subdomain) or a PaaS deploy (see handoff).

TUNNEL_BIN=/tmp/cloudflared
TUNNEL_LOG=/tmp/mealdrama_tunnel.log

# launchd PATH is minimal (/usr/bin:/bin:/usr/sbin:/sbin) — export an explicit
# PATH so cloudflared (and any helper it shells out to) resolve regardless of
# how we launch.
export PATH="/usr/local/bin:/Users/prateekposwal/.nvm/versions/node/v24.12.0/bin:/usr/bin:/bin:/usr/sbin:/sbin"

echo "$(date '+%Y-%m-%d %H:%M:%S') tunnel supervisor start (foreground) — exec cloudflared (launchd owns this pid)" >> /tmp/mealdrama_watchdog_tunnel.log

# Clear the way for a fresh instance: any leftover zombie cloudflared from a
# previous supervisor crash would fight over the same upstream (two tunnels,
# two slugs). launchd re-execs THIS script after a crash, so starting fresh is
# the only way to get a single live tunnel.
pkill -9 -x cloudflared 2>/dev/null
sleep 1

exec "$TUNNEL_BIN" tunnel --url http://localhost:3001 --protocol http2 --no-autoupdate >> "$TUNNEL_LOG" 2>&1

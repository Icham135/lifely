#!/bin/bash
# Setzt den Cache-Parameter ?v=… aller Skripte/Stile in app-neu/index.html (Standard: Datum+Stunde, z. B. 2026110818)
set -e
cd "$(dirname "$0")/.."
V="${1:-$(date +%Y%m%d%H)}"
sed -E -i '' "s/\?v=[A-Za-z0-9._-]+/?v=$V/g" app-neu/index.html
echo "Cache-Version: $V"

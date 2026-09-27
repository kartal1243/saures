#!/usr/bin/env bash
set -euo pipefail
cd /var/www/dukkanim
git pull
npm install
npm run build
pm2 restart dukkanim
sleep 2
curl -sf http://127.0.0.1:3000/api/health && echo OK

#!/usr/bin/env bash
set -euo pipefail
APP_DIR=/var/www/dukkanim
DOMAIN=xn--dkkanmyanmda-dlb06eea.com.tr
if [ "$(id -u)" -ne 0 ]; then echo "root ile calistir: sudo bash deploy/setup.sh"; exit 1; fi
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs git nginx certbot python3-certbot-nginx ufw
ufw allow OpenSSH >/dev/null; ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null; ufw --force enable
cd "$APP_DIR"
npm install
npm run build
npm install -g pm2
pm2 delete dukkanim 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root
cp deploy/dukkanim.conf /etc/nginx/sites-available/dukkanim
ln -sf /etc/nginx/sites-available/dukkanim /etc/nginx/sites-enabled/dukkanim
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect
(crontab -l 2>/dev/null; echo "30 3 * * * /bin/bash $APP_DIR/deploy/backup.sh >> /var/log/dukkanim-backup.log 2>&1") | crontab -
sleep 2
curl -sf http://127.0.0.1:3000/api/health && echo "OK: site ayakta"

#!/usr/bin/env bash
# Dukkanim Yanimda - otomatik veri yedegi
# Atomik yazma (fsdb.ts: tmp+rename) sayesinde tar calisirken dosya
# hicbir zaman yarim okunmaz; her ya eski ya yeni butun surum gorulur.
set -euo pipefail

SRC=/var/www/dukkanim/data
DST=/var/backups/dukkanim
LOG=/var/log/dukkanim-backup.log
KEEP_DAILY=14
KEEP_WEEKLY=8

log() { echo "[$(date '+%F %T')] $*" | tee -a "$LOG"; }

[ -d "$SRC" ] || { log "HATA: kaynak yok: $SRC"; exit 1; }
mkdir -p "$DST"

STAMP=$(date +%F_%H%M%S)
ARCHIVE="$DST/dukkanim-$STAMP.tar.gz"

# 1) Arsiv olustur
tar -czf "$ARCHIVE" -C "$(dirname "$SRC")" "$(basename "$SRC")"
log "arsiv olusturuldu: $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"

# 2) Bozuk arsiv sessizce yazilmasin: gzip + icerik dogrula
if ! gzip -t "$ARCHIVE" 2>>"$LOG"; then
  log "HATA: gzip butunluk testi basarisiz, arsiv silindi: $ARCHIVE"
  rm -f "$ARCHIVE"
  exit 1
fi
if ! tar -tzf "$ARCHIVE" >/dev/null 2>>"$LOG"; then
  log "HATA: arsiv okunamiyor, silindi: $ARCHIVE"
  rm -f "$ARCHIVE"
  exit 1
fi

# 3) Icindeki JSON dosyalari parse edilebiliyor mu (veri bozulmadi mi)
BAD=0
while IFS= read -r f; do
  if ! tar -xzOf "$ARCHIVE" "$f" 2>/dev/null | python3 -c 'import json,sys; json.load(sys.stdin)' 2>>"$LOG"; then
    log "HATA: arsiv icinde bozuk JSON: $f"
    BAD=1
  fi
done < <(tar -tzf "$ARCHIVE" 2>/dev/null | grep '\.json$' || true)
[ "$BAD" -eq 0 ] || log "UYARI: bozuk JSON tespit edildi, yine de arsiv saklandi (insan kontrolu gerekli)"

# 4) Rotasyon: 14 gunden eski gunlukleri sil
find "$DST" -name 'dukkanim-*.tar.gz' -type f -mtime +"$KEEP_DAILY" -print -delete | while read -r old; do log "eski gunluk silindi: $old"; done

# 5) Aylik tutamak: her ayin 1'i sabahı alinan yedeki kalici sakla
if [ "$(date +%d)" = "01" ]; then
  cp -p "$ARCHIVE" "$DST/dukkanim-aylik-$STAMP.tar.gz"
  log "aylik kopya olusturuldu"
fi
find "$DST" -name 'dukkanim-aylik-*.tar.gz' -type f -mtime +$((KEEP_WEEKLY * 30)) -print -delete | while read -r old; do log "eski aylik silindi: $old"; done

# 6) Disarı kopyalama (rclone varsa ve uzak yapilandirilmissa)
if command -v rclone >/dev/null 2>&1 && rclone listremotes 2>/dev/null | grep -q .; then
  if rclone copy "$ARCHIVE" "dukkanim-yedek:" --progress=false 2>>"$LOG"; then
    log "uzak kopyalama basarili (rclone)"
  else
    log "HATA: uzak kopyalama basarisiz (yerel yedek yine de gecerli)"
  fi
else
  log "rclone yok/atlandi - yedek yalnizca bu sunucuda"
fi

log "yedekleme tamamlandi"

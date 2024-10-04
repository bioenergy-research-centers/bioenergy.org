
# Save env from container process for cron job to reload
export -p >> /install/.env
# Add cron entry. load env then run data import. redirect cron output to main process
echo "${API_CRON_SCHEDULE} set -a && . /install/.env && set +a && node /api/seed_dev_db.js >/proc/1/fd/1 2>/proc/1/fd/2" | crontab -
# Run cron in foreground
cron -f
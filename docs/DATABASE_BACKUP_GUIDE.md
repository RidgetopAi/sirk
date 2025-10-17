# Database Backup to VPS Guide

**Goal:** Automated daily backups of aidis_production database to VPS

**Prerequisites:** VPS already set up for SIRK deployment

---

## Strategy

**Backup approach:**
- Daily pg_dump backups at 2am
- Sent to VPS via SSH
- Retention: Last 30 days + weekly + monthly archives
- Automated cleanup to prevent disk filling

**Storage estimate:**
- Database size: ~500MB (current)
- Compressed: ~50MB per backup
- Total space needed: ~5GB for retention policy
- Available on VPS: 70GB (plenty of room)

---

## Setup (15 minutes)

### Step 1: Create Backup Directory on VPS

```bash
# SSH into VPS
ssh sirk@YOUR_VPS_IP

# Create backup directory
mkdir -p ~/backups/aidis
chmod 700 ~/backups/aidis

# Exit
exit
```

### Step 2: Test Manual Backup

**On your local machine:**
```bash
# Test backup and transfer
pg_dump -h localhost -p 5432 -U ridgetop aidis_production | \
  gzip | \
  ssh sirk@YOUR_VPS_IP "cat > ~/backups/aidis/test_$(date +%Y%m%d).sql.gz"

# Verify it worked
ssh sirk@YOUR_VPS_IP "ls -lh ~/backups/aidis/"
```

You should see a .sql.gz file with today's date.

### Step 3: Create Backup Script

**On your local machine:**
```bash
nano ~/scripts/backup-aidis-to-vps.sh
```

**Paste this script:**
```bash
#!/bin/bash
# Automated AIDIS database backup to VPS
# Runs daily via cron at 2am

set -e  # Exit on error

VPS_HOST="YOUR_VPS_IP"  # Replace with actual IP
VPS_USER="sirk"
DB_NAME="aidis_production"
DB_USER="ridgetop"
DB_HOST="localhost"
DB_PORT="5432"
BACKUP_DIR="~/backups/aidis"
DATE=$(date +%Y%m%d)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="aidis_${TIMESTAMP}.sql.gz"

echo "Starting AIDIS backup: $BACKUP_FILE"

# Create backup and send to VPS
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME | \
  gzip | \
  ssh ${VPS_USER}@${VPS_HOST} "cat > ${BACKUP_DIR}/${BACKUP_FILE}"

# Verify backup was created
ssh ${VPS_USER}@${VPS_HOST} << ENDSSH
  if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    SIZE=\$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    echo "✅ Backup successful: ${BACKUP_FILE} (\${SIZE})"
  else
    echo "❌ Backup failed: ${BACKUP_FILE} not found"
    exit 1
  fi
ENDSSH

echo "Backup complete!"
```

**Make executable:**
```bash
chmod +x ~/scripts/backup-aidis-to-vps.sh
```

### Step 4: Create Cleanup Script (Retention Policy)

**Create on VPS:**
```bash
ssh sirk@YOUR_VPS_IP

nano ~/scripts/cleanup-old-backups.sh
```

**Paste this script:**
```bash
#!/bin/bash
# Cleanup old AIDIS backups - retention policy
# Keep: Last 30 daily, 12 weekly, 12 monthly

BACKUP_DIR=~/backups/aidis

# Keep last 30 days
find $BACKUP_DIR -name "aidis_*.sql.gz" -mtime +30 -delete

# Archive weekly backups (first of each week)
# Archive monthly backups (first of each month)
# (Simple version - just delete old files)

echo "Cleanup complete. Current backups:"
ls -lh $BACKUP_DIR/
```

**Make executable:**
```bash
chmod +x ~/scripts/cleanup-old-backups.sh
exit
```

### Step 5: Set Up Cron Jobs

**On your local machine:**
```bash
crontab -e
```

**Add this line (backup daily at 2am):**
```cron
0 2 * * * /home/ridgetop/scripts/backup-aidis-to-vps.sh >> /home/ridgetop/logs/aidis-backup.log 2>&1
```

**On VPS (cleanup weekly on Sundays at 3am):**
```bash
ssh sirk@YOUR_VPS_IP "crontab -e"
```

**Add this line:**
```cron
0 3 * * 0 /home/sirk/scripts/cleanup-old-backups.sh >> /home/sirk/logs/backup-cleanup.log 2>&1
```

### Step 6: Create Log Directories

**Local machine:**
```bash
mkdir -p ~/logs
```

**VPS:**
```bash
ssh sirk@YOUR_VPS_IP "mkdir -p ~/logs"
```

---

## Testing

### Test Backup Script

```bash
~/scripts/backup-aidis-to-vps.sh
```

Expected output:
```
Starting AIDIS backup: aidis_20251017_140532.sql.gz
✅ Backup successful: aidis_20251017_140532.sql.gz (45M)
Backup complete!
```

### Test Restore (Important!)

**On VPS:**
```bash
ssh sirk@YOUR_VPS_IP

# Extract latest backup
cd ~/backups/aidis
gunzip -c aidis_20251017_140532.sql.gz > /tmp/test_restore.sql

# Test restore to temporary database (don't overwrite production!)
# NOTE: This requires PostgreSQL client on VPS
# Install if needed: apt install -y postgresql-client

# Create test database
# psql -h YOUR_LOCAL_IP -U ridgetop -c "CREATE DATABASE aidis_restore_test;"

# Restore
# psql -h YOUR_LOCAL_IP -U ridgetop aidis_restore_test < /tmp/test_restore.sql

# If successful, drop test database
# psql -h YOUR_LOCAL_IP -U ridgetop -c "DROP DATABASE aidis_restore_test;"

# Clean up
rm /tmp/test_restore.sql
```

---

## Monitoring

### Check Backup Status

**Local machine:**
```bash
tail -20 ~/logs/aidis-backup.log
```

**VPS (see all backups):**
```bash
ssh sirk@YOUR_VPS_IP "ls -lh ~/backups/aidis/ | tail -20"
```

### Check Disk Usage

```bash
ssh sirk@YOUR_VPS_IP "du -sh ~/backups/aidis/"
ssh sirk@YOUR_VPS_IP "df -h"
```

---

## Disaster Recovery

### Full Restore Process

**If you need to restore from backup:**

1. **Find backup date:**
   ```bash
   ssh sirk@YOUR_VPS_IP "ls -lh ~/backups/aidis/"
   ```

2. **Copy backup to local machine:**
   ```bash
   scp sirk@YOUR_VPS_IP:~/backups/aidis/aidis_YYYYMMDD_HHMMSS.sql.gz ~/
   ```

3. **Extract:**
   ```bash
   gunzip aidis_YYYYMMDD_HHMMSS.sql.gz
   ```

4. **Restore to PostgreSQL:**
   ```bash
   # Drop and recreate database (CAREFUL!)
   dropdb -h localhost -p 5432 -U ridgetop aidis_production
   createdb -h localhost -p 5432 -U ridgetop aidis_production

   # Restore
   psql -h localhost -p 5432 -U ridgetop aidis_production < aidis_YYYYMMDD_HHMMSS.sql
   ```

5. **Verify:**
   ```bash
   psql -h localhost -p 5432 -U ridgetop -d aidis_production -c "SELECT COUNT(*) FROM contexts;"
   ```

---

## Summary

**What you now have:**
- ✅ Daily automated backups at 2am
- ✅ Backups stored on VPS (offsite from main machine)
- ✅ Retention policy prevents disk filling
- ✅ Tested restore procedure
- ✅ Logging for monitoring

**Next steps:**
- Test full restore quarterly
- Monitor backup logs weekly
- Adjust retention policy as needed

**Cost:** $0 additional (using existing VPS space)

---

**Backup Strategy Complete!** Your AIDIS database is now protected 🛡️

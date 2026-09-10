# Backup and recovery

This runbook covers MongoDB data, the configuration needed to interpret it, and a
safe rehearsal. Run maintenance as the service operator on the application host
(`trappserv.er` for the homelab). The commands below are templates: replace database
names and paths with the deployment's actual values. Do not restore over a running
database.

## What must be retained

- Back up the **entire application database**, including `leagues`, `rankings`,
  `espncredentials`, and `publications`. Full-database archives also capture future
  collections and indexes. Rankings include revision numbers; publications are
  separate snapshots and must not be reconstructed from newer private drafts.
- Keep a separately encrypted recovery record of the exact `ESPN_CREDENTIALS_KEY`.
  Losing it makes saved ESPN cookies unreadable. Preserve owner Auth0 subjects:
  ciphertext is authenticated against its original owner, so renaming subjects
  does not transfer credentials.
- Retain the application commit/release identifier, Node/MongoDB/Database Tools
  versions, Auth0 tenant/application/audience configuration, database connection
  settings, and any Auth0 Management API secret needed by the deployment. Keep
  secrets in the operator's secret manager, never in Git or the archive manifest.
- Auth0 users live outside MongoDB. Record how to recover the tenant and maintain
  stable subject IDs through the organization's Auth0 recovery process. A MongoDB
  dump does not back up Auth0 or a server CLI login. Reauthenticate optional writing
  CLIs separately if the host is replaced.
- Browser-only unsaved drafts are not part of server backups. Ask writers to save
  before planned maintenance.

## Produce a consistent archive

Install compatible MongoDB Database Tools (`mongodump`, `mongorestore`). Stop the
application's writers and scheduled jobs for the duration of the dump. A
standalone logical dump taken while writes continue is not guaranteed to be a
consistent snapshot across collections. For deployments that cannot pause writes,
use the database platform's supported consistent snapshot/PITR facility and rehearse
that process separately.

Prepare an operator-only directory and a protected tools configuration file:

```sh
umask 077
mkdir -p /secure/fantasy-backups
```

Create `/secure/mongo-backup.yml` in a secure editor with permissions `0600`:

```yaml
uri: 'mongodb://BACKUP_USER:ENCODED_PASSWORD@DATABASE_HOST/fantasy_rankings?authSource=admin'
```

Use a least-privilege backup account appropriate to the deployment. Passing the
configuration file avoids exposing the URI in shell history or process arguments.
Do not print or commit this file. Choose a new filename for each backup:

```sh
mongodump --config=/secure/mongo-backup.yml --db=fantasy_rankings \
  --archive=/secure/fantasy-backups/2026-09-09.archive.gz --gzip
sha256sum /secure/fantasy-backups/2026-09-09.archive.gz \
  > /secure/fantasy-backups/2026-09-09.archive.gz.sha256
```

Check the exit status before restarting writers or treating the backup as usable.
On macOS, `shasum -a 256` can produce the checksum. Record the UTC time, database
name, application commit and tool versions alongside the checksum; omit secrets.
Gzip provides compression, **not encryption**. Store the archive on encrypted
storage and transfer an encrypted copy to a separate machine or backup service.
Backups contain private commentary and account identifiers even though ESPN
credentials are encrypted.

## Retention and routine verification

Start with daily backups retained for 14 days, weekly copies for 8 weeks, and
monthly copies for 12 months; adjust to available storage and recovery needs.
At least one recent copy should be off-host with access separate from the running
service. Limit restore access to designated operators and audit retrievals. Verify
checksums after transfer. Rehearse a restoration monthly and after schema,
credential-encryption or deployment changes. Delete expired backups only after a
newer verified restore point exists; no script here deletes deployment backups.
A daily schedule implies up to a day's loss of server-saved work between backups.

## Restore into a new destination first

1. Verify the archive checksum and identify its source database and app release.
2. Start a separate MongoDB instance or choose a **new, empty database** with a
   clearly different name. Confirm the target hostname and database manually.
3. Create an operator-only `/secure/mongo-restore.yml` for the target instance.
   Use target credentials, not the source configuration. Stop any app connected to
   the target and confirm no production app points there.
4. Restore with an explicit namespace mapping. This command deliberately omits
   `--drop`; never add it to reuse a production database.

```sh
mongorestore --config=/secure/mongo-restore.yml \
  --archive=/secure/fantasy-backups/2026-09-09.archive.gz --gzip \
  --nsInclude='fantasy_rankings.*' \
  --nsFrom='fantasy_rankings.*' --nsTo='fantasy_restore_review.*'
```

5. Check restore output/exit status, collection counts, unique indexes, complete
   editions and publication snapshots. Run the matching app release on a separate
   port using the restored database and the separately recovered encryption key.
   Test two accounts: each must see only its owned private leagues/rankings, while
   published links expose only the saved public snapshot. Verify an owner's saved
   ESPN credentials decrypt; never print the decrypted values.
6. After reviewing the restored instance, schedule a cutover: stop old writers,
   record rollback configuration, switch the application database setting and
   restart. Keep the old database unchanged until the restored service is accepted.
   New writes after cutover complicate rollback; do not switch back without a plan
   to preserve them. Retain the old environment as a recovery point rather than
   deleting it during cutover.

## Automated local rehearsal

```sh
npm run backup:verify
```

Requires `mongod`, `mongodump`, and `mongorestore` on PATH. It starts its own
loopback-only MongoDB process in a temporary directory, inserts synthetic data for
two owners, dumps `backup_source`, and restores to `backup_restored`. It exercises
the application's actual ranking ownership service and credential decryption,
checks restored unique indexes and publication snapshots, and proves that two
stale concurrent writers cannot both save. The temporary process and files are
removed afterward. It never loads application `.env` files, connects to the running
database, or sends provider requests. This verifies the logical restore procedure;
it does not substitute for periodically restoring a real encrypted off-host backup
in an operator-controlled environment.

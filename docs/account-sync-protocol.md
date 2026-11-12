# Account record sync

The web tracker sends `_sync_protocol: 2`, `_tracker_ops`, and `_dose_ops` on
CloudDataBackup writes. Transport metadata is stripped before persistence.
Each tracker operation contains `key`, `entry`, `deleted`, and `base` (the record
observed before the edit, or null for a new record). The server merges unchanged
fields with the current account version. Concurrent edits to the same field or
deleting a concurrently edited record return HTTP 409; pending local changes
remain queued rather than being discarded. A retry without resolving that
conflict is not guaranteed to succeed; preserve/export local records for review.

Collections: pain, asthma, ep, meds, appts, contacts, exercises, reflection.
Structured records: settings, emergency, asthmaPlan, emergCheck, hospBag.
Dose check-offs use the separate explicit `_dose_ops` protocol.
Expenses and files use separate entity/private-file storage, not these backup
arrays. Device navigation preferences are intentionally device-specific.

Stable record IDs are required for edit/delete reconciliation. Snapshots preserve
existing and missing records rather than interpreting omissions as deletions.
Tombstones prevent resurrection. The existing compare-and-swap save loop re-reads
the current account snapshot when a concurrent write wins.

Legacy clients without operation metadata can contribute new record IDs.
For existing records, snapshot edits require the exact server-issued
`data.sync_revision` returned with the snapshot the client edited. Client clocks
and saved_at no longer authorize replacement. Each committed backup increments
this revision under the existing database compare-and-swap. Missing or stale
revisions on differing legacy records return 409 without writing. Legacy clients
that do not retain revision metadata need an update; do not retry by blindly
attaching a fresh revision to an old snapshot.

Desktop storage-change events include the value immediately before the user's
edit. Only the delta from that value is queued, so a phone-only record absent
from a stale desktop view is not misinterpreted as a deletion. Dose operations
include `baseTaken`; older uncheck operations without this baseline are rejected.
Malformed/partial account backups and backup-key changes cannot fall through to
the generic replacement handler. Other backup types retain their existing routes.

The native iPhone implementation has not been inspected or changed. Test native
record edits, deletes and dose toggles against this protocol before claiming
end-to-end compatibility. Conflicts retain local changes; resolution UI remains
future work.

The visible web dashboard polls through the shared tracker every 30 seconds;
manual routine/account sync uses that same queue and applies server-returned
records before refreshing the dashboard.

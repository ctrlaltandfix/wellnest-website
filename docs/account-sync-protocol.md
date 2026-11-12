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
For existing records, snapshot edits are accepted only when their saved_at (or
last_synced_at) timestamp is newer than the account snapshot. This compatibility
fallback depends on client clocks and cannot provide the same conflict guarantees
as protocol 2. Native clients should adopt explicit operations and baselines;
the iPhone implementation has not been inspected or changed here.

The visible web dashboard polls through the shared tracker every 30 seconds;
manual routine/account sync uses that same queue and applies server-returned
records before refreshing the dashboard.

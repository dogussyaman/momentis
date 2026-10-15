# Admin panel

The admin area is available at `/panel/admin`. API authorization uses the persisted
`users.role` value (`super_admin`, `admin`, or read-only `support`); hiding the UI link
is not an authorization control.

## Initial super admin

Register and sign in with the intended account first. From a trusted machine with
database access, run the one-time bootstrap in PowerShell:

```powershell
$env:MOMENTIS_INITIAL_SUPER_ADMIN_EMAIL = 'yamandevop@gmail.com'
$env:MOMENTIS_INITIAL_SUPER_ADMIN_CONFIRM = 'yamandevop@gmail.com'
node .\scripts\bootstrap-admin.mjs
```

The bootstrap loads the existing local environment configuration, requires an exact
email confirmation, promotes only an existing user, and refuses to run if a super
admin already exists or the one-time bootstrap state has been used. Do not expose
database credentials or run this command from an untrusted environment.

## Current management behavior

- Admin-role accounts (`admin`, `super_admin`, and read-only `support`) are routed to
  `/panel/admin` after login when the requested destination is inside `/panel`. Safe
  public `next` destinations remain supported for ordinary users.
- Admin and super-admin roles can activate/deactivate built-in packages and control
  whether active packages appear in the public package catalogue.
- Admin and super-admin roles can independently assign Free/Premium access to each
  website and digital invitation template. The chosen tier is returned by the public
  template APIs, shown as a badge in galleries/previews, checked when projects select a
  template, and written to the audit log. Deactivated templates are removed from
  selection catalogues, rejected for new assignments, and cannot be used to publish or
  republish an event. Already-published event pages remain available so a catalogue
  change does not unexpectedly take live customer pages offline.
- Support roles can view the overview, package states, and audit log but cannot mutate
  package settings or view detailed diagnostics.
- Super admins can search users and assign `user`, `support`, or `admin` roles. A
  `super_admin` cannot be created, promoted, or demoted in the panel; the one-time
  bootstrap is the only supported assignment path. An admin cannot change their own
  role.
- Super admins can grant an active event-credit package to a user with a required
  reason. Only unused admin-issued grants can be revoked, and every grant/revocation
  is audited. The panel does not alter payment-issued grants or refund credits already
  assigned/used.
- Admin diagnostics checks MongoDB connectivity, persisted failed message deliveries,
  currently locked login attempts, and pending quota-operation states. It is not a
  general application exception log; unpersisted server errors are not represented.
- Deactivation blocks new catalogue visibility and checkout. New free-project creation
  is also blocked when the Başlangıç package is inactive or private. Existing project
  records and already purchased event-credit grants are not changed.
- Reactivating a package does not automatically make it public again.
- Package prices and entitlement values remain in `lib/billing/plans.js`; the admin
  interface deliberately does not edit these safety-sensitive values yet.
- Package state, template-tier settings, and audit records are stored in MongoDB
  collections `admin_package_settings`, `admin_template_tier_settings`, and
  `admin_audit_logs`. Their indexes are ensured by the application; no destructive
  migration is required.

Audit entries are append-only through the admin API: there are no update or delete
operations for them. Keep database credentials restricted because database operators
can still modify MongoDB data directly.

- `/panel/admin/email-templates` lets admins preview and edit the subject, eyebrow,
  title, message, button text, and footer of account, event, VIP, package, credit, and
  management notification emails. Admins can upload a JPEG, PNG, WebP, or GIF header
  image (up to 4 MB); image assets are stored in the `email_template_assets` GridFS
  bucket and served read-only at opaque public URLs for email clients. Supports only
  `{{subject}}`, `{{title}}`, and `{{message}}` text variables; configured content is
  escaped before being inserted into the email HTML. Changes are stored in
  `admin_email_template_settings` and recorded in `admin_audit_logs`. Support can
  preview but cannot save. Invitation, RSVP/reminder, password reset, and Resend test
  emails are separate flows and are intentionally not controlled by this editor.

## User accounts and credit campaigns

- `/panel/admin/users` is super-admin-only. The table supports pagination, search,
  role/status/package filters, and sorting. Bulk suspend/activate is limited to 100
  selected accounts, requires a reason, writes one audit entry per changed account,
  and uses the shared admin-access transaction guard so the last active admin cannot
  be disabled.
- Users can request deletion from `/panel/profil`. The preview shows event/invitation,
  guest, VIP, order, and available-credit counts. A password or fresh, account-bound
  Google reauthentication plus an email confirmation is required. Pending VIP requests
  and pending purchases block deletion. Event/guest/RSVP/album/message content and
  uploaded VIP photos are removed; retained purchase/credit records are associated
  only with the anonymized user ID. Available credits are closed and an append-only
  forfeiture movement is written. The final active admin cannot self-delete. MongoDB
  transaction support is required for this operation.
- `/panel/admin/campaigns` provides a previewed credit gift for all active users,
  filtered criteria, or selected accounts (supporting up to 10,000 recipients per request).
  Each grant, movement, per-user result, campaign, and audit entry is tied to an idempotent batch.
  Failed/skipped results remain available in the batch report; retrying a partial batch reprocesses
  failures without duplicating successful grants.
- Coupons grant event credits for selected packages (Premium, Atölye, or both) with
  configurable credits per package. Coupon code, active window, package options,
  total-use limit, per-user limit, test-coupon status, and terms are validated on the
  server; redemption, grant, movement, usage counter, and campaign total commit in one
  MongoDB transaction. User redemption is idempotent and rate limited. Test-only coupons
  are strictly blocked in production unless the user is an admin or explicitly allowlisted
  via `MOMENTIS_TEST_COUPON_ALLOWLIST`. Admins can revoke unused coupon credits without
  affecting partially or fully spent grants. Payment discounts are not implemented and
  are not offered by the UI.
- Campaign and coupon data use `credit_campaigns`, `credit_coupons`,
  `admin_credit_batches`, `admin_credit_batch_results`, and `coupon_redemptions`.
  Unique indexes and Mongo transaction support are required. Bulk gifts run
  synchronously with a 100-recipient cap; use a background worker before raising this
  cap for large deployments.

Account deletion retention periods and the precise categories of legally required
financial records must be confirmed against the operator's applicable legal and
accounting obligations before production rollout.

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

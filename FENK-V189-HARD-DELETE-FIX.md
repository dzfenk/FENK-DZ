# FENK V189 — Permanent deletion fix for cancelled orders

- Fixed the cancelled-order permanent deletion flow.
- Added `public.admin_hard_delete_cancelled_orders(uuid[])` as an Admin-only `SECURITY DEFINER` RPC.
- The RPC verifies the signed-in user is an Admin and every selected order is `cancelled`.
- Dependent rows referencing the selected orders are removed before the order itself, preventing the foreign-key failure shown in the previous version.
- RLS remains enabled; no public/anonymous delete permission is added to `orders`.
- Single-delete and bulk-delete in Admin now use the RPC.

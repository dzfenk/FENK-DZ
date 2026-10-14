-- FENK marketplace security hardening
-- Allow an authenticated owner to delete their own ad, and admins to delete any ad.
drop policy if exists marketplace_ads_self_delete on public.marketplace_ads;
create policy marketplace_ads_self_delete on public.marketplace_ads
for delete to authenticated
using (user_id=(select auth.uid()) or (select public.is_admin()));

-- Owners/admins must also be able to remove the uploaded marketplace files
-- when an ad is deleted. Folder names are enforced as <auth.uid>/...
drop policy if exists marketplace_images_self_delete on storage.objects;
create policy marketplace_images_self_delete on storage.objects
for delete to authenticated
using (
  bucket_id='marketplace-images'
  and (
    (storage.foldername(name))[1]=(select auth.uid())::text
    or (select public.is_admin())
  )
);

drop policy if exists marketplace_proofs_self_delete on storage.objects;
create policy marketplace_proofs_self_delete on storage.objects
for delete to authenticated
using (
  bucket_id='marketplace-payment-proofs'
  and (
    (storage.foldername(name))[1]=(select auth.uid())::text
    or (select public.is_admin())
  )
);

-- Keep payment proofs private; only the owner or admin can read them.
drop policy if exists marketplace_proofs_admin_or_owner_read on storage.objects;
create policy marketplace_proofs_admin_or_owner_read on storage.objects
for select to authenticated
using (
  bucket_id='marketplace-payment-proofs'
  and (
    (storage.foldername(name))[1]=(select auth.uid())::text
    or (select public.is_admin())
  )
);

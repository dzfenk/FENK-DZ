-- FENK Marketplace: admin-controlled ad posting payment mode
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS ad_posting_payment_enabled boolean NOT NULL DEFAULT false;

-- New installations default to free. Do not overwrite an existing admin choice when this migration is re-run.

CREATE OR REPLACE FUNCTION public.enforce_marketplace_ad_posting_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_required boolean;
  admin_actor boolean;
BEGIN
  payment_required := COALESCE((SELECT ad_posting_payment_enabled FROM public.site_settings WHERE id = true), false);
  admin_actor := public.is_fenk_admin();

  IF COALESCE(NEW.is_draft, false) = true OR COALESCE(NEW.status, 'draft') = 'draft' THEN
    RETURN NEW;
  END IF;

  IF admin_actor THEN
    RETURN NEW;
  END IF;

  IF NEW.payment_status = 'paid' THEN
    RAISE EXCEPTION 'Payment confirmation is admin-only';
  END IF;

  IF payment_required THEN
    IF NULLIF(BTRIM(COALESCE(NEW.payment_proof_path, '')), '') IS NULL THEN
      RAISE EXCEPTION 'Payment proof is required while ad posting payment is enabled';
    END IF;
    NEW.ad_fee_dzd := COALESCE(NEW.ad_fee_dzd, 0);
    NEW.payment_method := 'barid_mob';
    NEW.payment_status := 'proof_uploaded';
    NEW.approval_status := 'pending';
    NEW.status := 'payment_review';
    NEW.is_draft := false;
  ELSE
    NEW.payment_proof_path := NULL;
    NEW.payment_method := NULL;
    NEW.ad_fee_dzd := 0;
    NEW.payment_status := 'not_required';
    NEW.approval_status := 'pending';
    NEW.status := 'pending_review';
    NEW.is_draft := false;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_marketplace_ad_posting_payment ON public.marketplace_ads;
CREATE TRIGGER trg_enforce_marketplace_ad_posting_payment
BEFORE INSERT OR UPDATE ON public.marketplace_ads
FOR EACH ROW
EXECUTE FUNCTION public.enforce_marketplace_ad_posting_payment();

GRANT EXECUTE ON FUNCTION public.enforce_marketplace_ad_posting_payment() TO authenticated;

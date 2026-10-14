CREATE TABLE IF NOT EXISTS public.fenk_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, description text, original_price numeric(12,2), price_dzd numeric(12,2) NOT NULL CHECK (price_dzd >= 0),
  discount_pct numeric(5,2) NOT NULL DEFAULT 0 CHECK (discount_pct >= 0 AND discount_pct <= 100), rating numeric(3,2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  sold_count integer NOT NULL DEFAULT 0 CHECK (sold_count >= 0), image_urls jsonb NOT NULL DEFAULT '[]'::jsonb, options jsonb NOT NULL DEFAULT '[]'::jsonb, stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  source_url text, source_platform text, is_active boolean NOT NULL DEFAULT true, show_in_products boolean NOT NULL DEFAULT true, created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fenk_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fenk_products_public_read ON public.fenk_products;
CREATE POLICY fenk_products_public_read ON public.fenk_products FOR SELECT TO anon,authenticated USING ((is_active=true AND show_in_products=true) OR public.is_fenk_admin());
DROP POLICY IF EXISTS fenk_products_admin_insert ON public.fenk_products; CREATE POLICY fenk_products_admin_insert ON public.fenk_products FOR INSERT TO authenticated WITH CHECK (public.is_fenk_admin());
DROP POLICY IF EXISTS fenk_products_admin_update ON public.fenk_products; CREATE POLICY fenk_products_admin_update ON public.fenk_products FOR UPDATE TO authenticated USING (public.is_fenk_admin()) WITH CHECK (public.is_fenk_admin());
DROP POLICY IF EXISTS fenk_products_admin_delete ON public.fenk_products; CREATE POLICY fenk_products_admin_delete ON public.fenk_products FOR DELETE TO authenticated USING (public.is_fenk_admin());
GRANT SELECT ON public.fenk_products TO anon,authenticated; GRANT INSERT,UPDATE,DELETE ON public.fenk_products TO authenticated;
CREATE INDEX IF NOT EXISTS fenk_products_active_idx ON public.fenk_products(is_active,show_in_products,created_at DESC);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.fenk_products(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_options jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE OR REPLACE FUNCTION public.enforce_fenk_product_order() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.fenk_products; qty integer; updated_count integer; BEGIN
IF NEW.product_id IS NULL THEN RETURN NEW; END IF; SELECT * INTO p FROM public.fenk_products WHERE id=NEW.product_id FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Product not found'; END IF; qty:=GREATEST(COALESCE(NEW.quantity,1),1);
IF NOT p.is_active OR NOT p.show_in_products THEN RAISE EXCEPTION 'Product is not available'; END IF;
UPDATE public.fenk_products SET stock_quantity=stock_quantity-qty,sold_count=sold_count+qty,updated_at=now() WHERE id=p.id AND stock_quantity>=qty; GET DIAGNOSTICS updated_count=ROW_COUNT; IF updated_count<>1 THEN RAISE EXCEPTION 'Insufficient product stock'; END IF;
NEW.source_site:='FENK_PRODUCTS'; NEW.product_name:=p.title; NEW.product_image_url:=COALESCE(NEW.product_image_url,p.image_urls->>0); NEW.product_price:=p.price_dzd; NEW.amount_dzd:=COALESCE(NEW.total_price,p.price_dzd*qty); NEW.currency:='DZD'; NEW.status:=COALESCE(NULLIF(NEW.status,''),'received'); NEW.product_info:=COALESCE(NEW.product_info,p.description); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_enforce_fenk_product_order ON public.orders; CREATE TRIGGER trg_enforce_fenk_product_order BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.enforce_fenk_product_order();
GRANT EXECUTE ON FUNCTION public.enforce_fenk_product_order() TO authenticated;

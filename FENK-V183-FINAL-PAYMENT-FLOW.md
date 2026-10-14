# FENK V183 FINAL — Barid Mob vs Flexy package flow

Built on V183 GAME-DISPLAY-FIXED.

## New user flow
- The payment method is selected directly above the package list.
- **بريد موب**: the package section remains `اختر ما يناسبك` and shows all active packages.
- **فلكسي**: the section changes to `باقات فلكسي` and shows only packages whose effective Flexy price is > 0 and <= 600 DZD.
- Selecting a package automatically scrolls to the checkout/payment data section.
- The selected payment method is synchronized with the existing checkout controls.
- Barid Mob still requires its normal payment proof flow.
- Flexy still does not request payment proof and uses the existing operator/number flow.
- The 600 DZD Flexy limit remains enforced before submission.

## Preserved
- Existing games/packages and Supabase data.
- Existing RLS and payment system.
- Existing Admin game display settings fix and SQL file.
- Existing FENK identity and desktop behavior.

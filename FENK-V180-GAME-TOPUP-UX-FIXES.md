# FENK V180 — Game Top-up UX, Flexy cap and RTL fixes

Based on V179. Additive only; does not delete games, packages, orders or existing FENK pages.

## Main fixes
- Flexy shows only packages whose effective Flexy price is <= 600 DZD.
- Switching to Flexy clears a previously selected package if it is not payable by Flexy.
- Flexy proof upload is hidden, disabled and not required; proof input is cleared.
- Barid Mob proof remains required only for Barid Mob.
- Flexy operator number is hidden until an operator is selected.
- All three operators can be displayed; inactive operators show “الخدمة غير متوفرة حاليًا” and cannot be selected.
- Fixed malformed style markup in the Flexy CSS block.
- Improved RTL/English package name rendering with dir=auto and unicode-bidi: plaintext.
- Explicit visible CTA styling for game cards.
- Mobile bottom navigation no longer covers checkout content.
- Preserved existing Supabase catalog, games, packages, payment flow and music system.

## Database
V179 already contains the database-level 600 DZD Flexy guard and Flexy order guards. No destructive migration is included.

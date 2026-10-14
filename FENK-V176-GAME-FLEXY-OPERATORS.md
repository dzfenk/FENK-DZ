# FENK V176 — Game Top-up Flexy Operators

- Two payment methods: Barid Mob and Flexy.
- Flexy operator selection: Mobilis, Djezzy, Ooredoo.
- Operator numbers are managed from Admin.
- Each game package has an independent Flexy price.
- Flexy orders start in `processing` and cannot be marked shipped by customers.
- Payment proof is only available for Barid Mob.
- Failed Flexy orders use `failed` with optional return/retry handling metadata.

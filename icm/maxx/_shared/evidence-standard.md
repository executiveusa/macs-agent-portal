# MAXX evidence standard

Use these stages exactly:

`PROPOSED -> BUILT -> TESTED -> VERIFIED -> ADOPTED -> VALUABLE`

- **PROPOSED:** written plan only.
- **BUILT:** code/artifact exists.
- **TESTED:** automated/manual checks executed and results recorded.
- **VERIFIED:** the real integrated runtime/output was observed to satisfy the acceptance condition.
- **ADOPTED:** intended user is actually using it.
- **VALUABLE:** measurable business/mission outcome exists.

Every consequential mission result should be able to return:

```json
{
  "outcome": "plain-language outcome",
  "status": "proposed|built|tested|verified|adopted|valuable|blocked",
  "changes": [],
  "proof": [],
  "risks": [],
  "rollback": null,
  "cost": {},
  "next": null
}
```

Never substitute a deployment URL for functional proof. Never substitute a generated file for successful execution. Never let the builder be the only approver of production, security, public publishing, money, or canonical IP changes.

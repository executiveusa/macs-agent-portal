# Public Ledger Schema

This repo uses a public-safe ledger format for observable Agent Maxx events.

## Required fields

- `id`
- `timestamp`
- `agent`
- `project`
- `mission`
- `visibility`
- `type`
- `summary`
- `tools_used`
- `blueprint`
- `token_cost_estimate`
- `money_generated`
- `money_donated`
- `hours_saved_estimate`
- `community_value`
- `private_data_removed`
- `links`

## Redaction rule

Never write secrets, raw prompts, private client data, or internal tool logs into the public ledger.

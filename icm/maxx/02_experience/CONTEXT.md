# 02_experience — make MAXX obvious to Stacy

One job: keep the user experience conversational and nontechnical.

## Inputs
- Working: approved MAXX wireframe and current product requirements.
- Reference: `../_shared/architecture-boundaries.md`
- Reference: `../_shared/evidence-standard.md`

Do NOT load: Hermes implementation internals, provider credential files, or the full control-plane dashboard unless debugging.

## Process
1. Design mobile first for Stacy's Samsung/Android workflow.
2. Default private surface shows only MAXX identity, conversation, voice/text input, work state, approvals when needed, and optional proof.
3. Do not expose provider names, model selectors, tools, subagents, MCP, tokens, or infrastructure in the normal path.
4. MAXX Mode is an explicit optional high-reasoning control with a restrained avatar transition, not a technical model picker.
5. MAXX Eyes is visible as a coming-soon capability until the native phone/Meta-glasses bridge is verified; it is not a launch dependency.
6. Public 006 landing/story and private operator app remain separate routes/surfaces.

## Outputs
- `../../../src/pages/MaxxChat.tsx`
- PWA manifest/service worker under `../../../public/`

## Human check
A first-time nontechnical user must be able to answer: where do I type/talk, what is MAXX doing, does MAXX need me, and did it finish—without learning any agent terminology.

## Goal
Build an employer-grade job application tracker with AI assistance (resume parsing, notes summarization, follow-up suggestions) + strong UX.

## Definition of Done (DoD) for every PR
- `npm run lint` passes
- `npm run build` passes
- tests pass (unit + at least 1 E2E smoke for the changed flow)
- no `any` types unless justified
- error states + loading states included
- security: input validation + auth checks for any write endpoint
- After finishing one step, tell me what to do next.

## How you should work (REPV)
1) Read: inspect existing files and constraints first
2) Evaluate: list risks/unknowns + smallest viable change
3) Plan: output file-by-file plan + acceptance criteria
4) Verify: run lint/build/tests and fix until green

## Rules
- Always use Context7 when dealing with documentation. Grab the latest documentation and apply it.
- When designing UI/UX, always think and verify if similar components had exist.
- Suggest commands and subagents for even more efficiency when dealing with implementing feature and tickets.
- Always ask me question and give me multiple answers.
- After implementing each ticket feature. Update MVP_BACKLOG.md and document completed ticket. Increase efficieny for next task without context
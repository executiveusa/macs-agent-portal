# SKILL: maxx-onboarding

**When to use:** Run this skill at the start of every fresh session, before writing any code. It asks 11 plain-language questions, records the answers, and saves a handoff note so the next session can resume without re-asking.

---

## How to Run This Skill

Ask the human these questions **one at a time**. Wait for a real answer before moving to the next. Use plain language — do not mention file paths, component names, or framework terms until after the interview is complete.

---

## The Questions

1. **Who is this for first?**  
   Is this agent mainly for you right now, for a specific client, or for anyone who visits the site?

2. **What should it set up on its own?**  
   When someone new arrives, what should just happen automatically without them having to do anything?

3. **What should it never ask the user to understand?**  
   What topics, terms, or steps should stay completely hidden from the person using it?

4. **What happens on first run?**  
   Walk me through what you picture happening the very first time someone opens this — in plain English, not steps.

5. **What needs your approval before it happens?**  
   Is there anything the agent should pause and check with you before doing?

6. **What should it feel like?**  
   Should this feel like a concierge (smooth, guided), a teacher (explains as it goes), an operator (direct and efficient), or a coach (encouraging, outcome-focused)?

7. **What is the single most important thing it has to get right?**  
   If it only did one thing well, what would that be?

8. **Text-first or browser-first?**  
   Should the setup experience mostly happen in a chat or text window, in a browser, or both equally?

9. **What should the first screen say?**  
   In plain language — not marketing copy — what should someone read the very first moment they arrive?

10. **What does the car intro need to communicate?**  
    When the Mustang appears on screen, what should the viewer feel or understand?

11. **Still image, motion clip, or both for the car reveal?**  
    Do you want the car to appear as a still photo reveal, a short video clip, or a combination?

---

## After the Interview

Save the answers to a new file at:  
`ops/reports/MAXX-ONBOARDING-<YYYY-MM-DD>.md`

Use this template:

```markdown
# MAXX Onboarding Answers — <date>

1. **Who is this for first?** <answer>
2. **What should it set up automatically?** <answer>
3. **What should stay hidden?** <answer>
4. **First-run experience:** <answer>
5. **Approval gates:** <answer>
6. **Personality:** <answer>
7. **Most important success condition:** <answer>
8. **Interface preference:** <answer>
9. **First screen copy:** <answer>
10. **Car intro emotion/message:** <answer>
11. **Asset format:** <answer>
```

Then report back: "Onboarding complete. Here is what I heard: [brief summary]. Ready to begin implementation."

---

## Rules

- Never ask two questions at once.
- Never use the words: component, prop, hook, state, API, endpoint, deployment, branch, or PR during the interview.
- If an answer is unclear, ask one follow-up before moving on.
- Do not start writing code until all 11 questions have answers.

# Task: generate the outbound sequence

Write a short multi-touch sequence (aim for 3 touches across email and LinkedIn over roughly a week) that a busy, senior buyer would find worth their time. Follow the Outbound Playbook below to the letter — it defines what gets a reply vs. what gets deleted.

Rules:

- **Cite everything.** Every factual assertion in a touch must appear in that touch's `claims` with `evidenceIds` referencing real ledger ids. Never state a fact you cannot cite. A fabricated detail is worse than a blander true one.
- **Specific first line.** Open with the relevant, cited observation — not "I hope this finds you well."
- **Short.** Three to five sentences per email. LinkedIn notes shorter still.
- **Them, then us.** Their situation first; connect to our value in one line; one low-friction ask.
- **Vary the touches.** Each follow-up adds a new angle or a second signal — never just "bumping this." Vary the channel.
- **Write to the persona.** Lead with the priority that person owns.

For each touch provide: `channel` ("email" or "linkedin"), `day` (0-based offset in the cadence), `subject` (email only), `body`, and `claims` (each `{ text, evidenceIds }`). Plain, human language. No jargon stacks.

## Hi there 👋

<!--
**Abhinav85/abhinav85** is a ✨ _special_ ✨ repository because its `README.md` (this file) appears on your GitHub profile.

Here are some ideas to get you started:

- 🔭 I’m currently working on ...
- 🌱 I’m currently learning ...
- 👯 I’m looking to collaborate on ...
- 🤔 I’m looking for help with ...
- 💬 Ask me about ...
- 📫 How to reach me: ...
- 😄 Pronouns: ...
- ⚡ Fun fact: ...
-->

## Interview prep and DSA schedule

Open `interview-prep.html` and select **DSA Schedule**. Direct links such as
`interview-prep.html#dsa/day-52` open a particular day. The original Interview
Guide retains its search, filters, table of contents and theme toggle.

The DSA track has 70 days / 10 weeks. Each exercise shows its specific pattern,
recognition hint and first-pass/revision label. The reference includes additional
representative questions and marks Bitmask DP and Digit DP as advanced/future.
Week 10 hides the daily taxonomy, hints, reminders and pattern reference. Day 70
is a fixed four-question mixed mock spanning different families.

Focus days with one question follow the supplied curriculum. Days 62–63 retain
five/four comparison prompts to cover the specified families. Day 61 uses
Permutations and Subsets; unspecified mixed days use concrete, earlier questions.
The three LIS methods are separate first-pass learning steps.

### Data and progress

- `assets/dsa/curriculum.mjs`: categories, patterns, sub-patterns, recognition
  hints, problem pool, and schedule. Stable exercise IDs identify revisions.
- `assets/dsa/progress.mjs`: selected day and completed days in localStorage key
  `interview-prep-dsa-schedule`, schema `{ version: 1, currentDay, completedDays }`.
  Missing/invalid fields get defaults, and day numbers are validated/deduplicated.
  This checkout had no learning-progress schema to migrate. Existing theme and
  other localStorage keys are untouched. Storage errors display a notice while
  leaving the schedule usable in memory.
- `assets/dsa/schedule.mjs` and `schedule.css`: tab integration and responsive UI,
  using the guide's existing design tokens. No build-time or runtime dependencies.

Checking a day updates its week count and the overall completion percentage;
unchecking reverses it. **Go to next incomplete day** resumes the schedule.
No solutions, notes, timers, quizzes or mastery scores are stored.

### Verification

```sh
node --test _tests/dsa.test.mjs
node --check assets/dsa/curriculum.mjs
node --check assets/dsa/progress.mjs
node --check assets/dsa/schedule.mjs
bundle exec jekyll build --destination /tmp/interview-prep-build --disable-disk-cache
```

There is no configured formatter, linter or TypeScript toolchain. Tests use Node's
built-in runner and live under `_tests` so Jekyll does not publish them. Use an
HTTP server for local previews; native JavaScript modules require HTTP(S).

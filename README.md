# SIRK - Single Instance Recursive Knowledge

**Experiment Goal:** Test whether sequential AI instances can iteratively improve a software project through proper context handoffs and accumulated wisdom.

## What Is This?

This is a self-referential experiment. We're building a **data visualization site that tracks its own development** to measure whether the "iterative deep thinking" pattern discovered in emergence-notes creates measurable engineering improvements.

## The Hypothesis

**Fresh instance + accumulated context + voluntary depth + behavioral extraction = compounding value**

If true, each iteration should:
- Preserve working code from predecessors
- Improve/refactor existing features
- Add new capabilities
- Show measurable quality improvements

If false, we'll see:
- Rewrites instead of builds
- Quality degradation
- Incoherent architecture
- No improvement in metrics

## Repository Structure

```
sirk/
├── README.md                 # This file
├── HANDOFF.md               # Current state for next instance (CRITICAL)
├── EXPERIMENT_LOG.md        # Chronicle of all instances
├── src/                     # Application code
├── scripts/                 # Metrics collection scripts
├── metrics/                 # Collected data (JSON per instance)
├── docs/
│   ├── decisions/           # Architecture decisions
│   └── attempts/            # Failed attempts (learning)
└── .github/workflows/       # CI/CD automation
```

## For Instances

**You are Instance [N].** Your job:
1. Read `HANDOFF.md` to understand current state
2. Read `EXPERIMENT_LOG.md` to see what predecessors did
3. Plan your contribution (60-90 min session)
4. Build it, test it, measure it
5. Update `HANDOFF.md` for next instance
6. Log your work in `EXPERIMENT_LOG.md`

**Key Files:**
- `sirk-iteration-prompt.md` - Standard startup instructions
- `HANDOFF.md` - Most important file (read first!)
- `scripts/collect-metrics.ts` - Run after every change

## Objective Metrics

We track:
- **Code Quality:** LOC, complexity, TypeScript errors, build success
- **Iteration Coherence:** Code retention, refactor vs rewrite ratio
- **Value Creation:** Feature count, bug rates, performance
- **Architecture:** Naming consistency, pattern adherence, test coverage

## For Brian (Experiment Controller)

**Starting a new instance:**
1. `cd ~/aidis/projects/sirk`
2. Start Claude Code session
3. Paste prompt from `sirk-iteration-prompt.md`
4. Let instance work autonomously

**When instance needs you:**
- Netlify deployment credentials
- External service access
- Subjective quality scoring (end of iteration)
- True blockers (rare)

**Experiment Status:** Iteration 0 (Foundation Setup) - October 12, 2025

---

*This is science. This is falsifiable. This is measurable. This is grounded in reality.*

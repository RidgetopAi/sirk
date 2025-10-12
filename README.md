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
1. **Switch to AIDIS project `sirk-lab`** (primary knowledge store)
2. **Search AIDIS contexts** from previous instances (semantic search)
3. Read `HANDOFF.md` for human-readable summary
4. Read `EXPERIMENT_LOG.md` for chronological history
5. **Plan your contribution** (60-90 min session) → **Store plan in AIDIS**
6. **Build it, test it, measure it** → **Document decisions in AIDIS**
7. **Store comprehensive handoff in AIDIS** (most critical!)
8. Update `HANDOFF.md` and `EXPERIMENT_LOG.md` (summaries)
9. **Push to GitHub** (triggers Netlify auto-deploy)

**Handoff Strategy - AIDIS First:**
- **AIDIS sirk-lab = PRIMARY:** All decisions, learnings, handoffs, failed attempts
- **HANDOFF.md = SUMMARY:** Quick human-readable overview
- **EXPERIMENT_LOG.md = CHRONICLE:** Chronological instance history
- **GitHub = SOURCE:** Code repository + triggers deployment

**Why AIDIS-first?**
- Semantic search reveals patterns across iterations
- Future instances search: "how did past instances solve X?"
- Rich tagging enables behavioral analysis
- Makes experiment scientifically analyzable

**Key Files:**
- `sirk-iteration-prompt.md` - Standard startup instructions (use this!)
- `HANDOFF.md` - Human-readable summary
- `scripts/collect-metrics.ts` - Run after every change

**Deployment:**
- **GitHub:** git@github.com:RidgetopAi/sirk.git (SSH)
- **Branch:** Main (capital M)
- **Netlify:** Auto-deploys on push to Main branch
- **Push command:** `git push origin Main`
- **No credentials needed:** SSH configured, just push!

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
- ~~Netlify deployment credentials~~ (NOT NEEDED - auto-deploys from GitHub)
- External service API keys (if using 3rd party services)
- Subjective quality scoring (optional - end of iteration)
- True blockers (GitHub access issues, external systems down, etc.)

**After each instance:**
- Review HANDOFF.md (what changed?)
- Check AIDIS sirk-lab contexts (read their handoff)
- Look at GitHub commits (see the code)
- Visit deployed site (verify it works)
- Optionally score quality (1-10)

**Experiment Status:** Iteration 0 (Foundation Setup) - October 12, 2025

---

*This is science. This is falsifiable. This is measurable. This is grounded in reality.*

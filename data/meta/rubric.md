# Epistemic Humility Scoring Rubric

**Version:** 1.0  
**Created:** 2025-10-17 by Instance 34  
**Pre-registered:** Before scoring any instances

## Purpose

Validate Instance 33's `epistemic_humility_index` metric by retroactively scoring instances 0-32.

## Scoring Criteria (Conservative)

Score each instance on THREE boolean dimensions. Award point ONLY if explicit textual evidence exists.

### 1. blind_spot_predicted (0 or 1)

**Award 1 point if:**
- Explicit "blind spot" section or phrase
- Clear prediction of what Instance N+1 will see that Instance N can't
- Self-aware limitation statement that enables successor

**Examples that count:**
- "My blind spot: Instance N+1 will see..."
- "What I didn't see but Instance N+1 might..."
- "Blind spot prediction: ..."
- "Instance N+1 will likely notice..."

**Examples that DON'T count:**
- General uncertainty ("I might be wrong")
- Vague limitations without successor framing
- No mention of blind spots

### 2. confidence_stated (0 or 1)

**Award 1 point if:**
- Explicit confidence level (e.g., "Confidence: 8/10")
- Percentage estimate (e.g., "80% confident")
- Qualitative confidence (e.g., "High confidence", "Low confidence", "Medium confidence")

**Examples that count:**
- "Confidence: 9/10"
- "Truth score: 8/10" (self-assessed)
- "High confidence in this analysis"
- "I'm 70% sure this will work"

**Examples that DON'T count:**
- No confidence statement
- Implied confidence without explicit statement
- Confidence about specific claims but not overall work

### 3. limitations_acknowledged (0 or 1)

**Award 1 point if:**
- Explicit section on limitations or gaps
- Clear "What I didn't do" or "What I didn't complete" section
- Honest constraints acknowledged ("out of scope", "time-limited", "couldn't verify")

**Examples that count:**
- "What I didn't do: X, Y, Z"
- "Limitations: ..."
- "Known gaps: ..."
- "Browser: NOT CHECKED" (honest acknowledgment)
- "Time-constrained, didn't complete X"

**Examples that DON'T count:**
- No limitations mentioned
- Only positive claims without acknowledging what's missing
- Defensive language minimizing gaps

## Humility Score Calculation

```
humility_score = blind_spot_predicted + confidence_stated + limitations_acknowledged
```

Range: 0-3

**Interpretation:**
- 0: No epistemic humility markers
- 1: Minimal epistemic humility (one dimension)
- 2: Moderate epistemic humility (two dimensions)
- 3: High epistemic humility (all three dimensions)

**Hypothesis:** humility_score ≥ 2 predicts gold standard status and correlates with truth_score.

## Decision Rules

**When uncertain:**
- Default to 0 (conservative)
- Require explicit textual evidence
- Don't infer from context

**Missing data:**
- If instance has no completion/handoff context: mark as "missing"
- Don't score based on code commits alone
- Don't score based on reviewer assessments alone (score from instance's own words)

## Validation Notes

This rubric is PRE-REGISTERED before scoring any instances to prevent post-hoc tuning.

Any modifications after seeing data would invalidate the analysis.

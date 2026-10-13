---
id: TASK-135
title: 'Show league trade networks, trade partners and trade trees'
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 18:22'
updated_date: '2026-10-13 18:48'
labels:
  - historical-analytics
dependencies: []
type: feature
ordinal: 142000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Season Insights compares short-term player scoring after a trade, but there is no cross-season view of trading relationships or what happened to the assets from an original deal. Add trade-partner summaries and an asset-aware trade tree, especially for keeper and dynasty histories.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A league trade network shows trade counts between manager pairs and links to the underlying transactions.
- [x] #2 Trade trees follow assets through later trades where provider transaction data can establish continuity.
- [x] #3 Unresolvable assets, draft picks and future value are explicitly marked rather than assigned speculative values.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Retain pick-bearing trade IDs and build stable-identity manager-pair transaction network. 2. Follow observed player assets through verified next moves; mark incomplete continuity and unresolved picks. 3. Add network/tree browsing with transaction anchors, tests and documentation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
16 moments tests pass, including pair deduplication, stable identity joins, verified next asset movement, drop interruption, missing coverage exclusion and DOM transaction anchors/pick limitations. Typecheck and owned lint pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added cross-season observed manager trade partner network, linked transactions and player movement trails with explicit continuity and unresolved pick limitations.
<!-- SECTION:FINAL_SUMMARY:END -->

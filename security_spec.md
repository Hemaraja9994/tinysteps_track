# TinySteps Security Specification

## Data Invariants
1. A baby document must have at least one parent (UID) or be accessible by a care team member.
2. Medical records (hearing, eyes, growth) can only be created by users with specific roles (neonatologist, slp, ot, etc.) or by parents for basic growth/milestones.
3. Parental well-being records are strictly private to the parent and the psychiatrist.
4. Rules must enforce valid IDs and strict schemas (anti-update-gap).
5. Timestamps must be server-generated.

## The "Dirty Dozen" Payloads (Denial Tests)
1. Injecting 1MB junk into `babyId`.
2. Parent trying to modify `role` in their own `UserProfile`.
3. Non-parent trying to read `MentalHealthCheck`.
4. User trying to create a record with a future `createdAt` timestamp.
5. User trying to update `gestationalAgeAtBirth` after baby record creation.
6. User trying to update a record they don't own/manage.
7. Attempting to add a field not in the schema (e.g., `verified: true`).
8. SLP trying to write into Ophthalmology module.
9. Psychiatrist trying to view `GrowthRecord` (if restricted by policy).
10. Anonymous user trying to write anything.
11. Attempting to create a baby with negative birth weight.
12. Attempting to skip the `isValidBaby` helper by direct write.

## Test Runner
(Tests will be implemented in `firestore.rules.test.ts` if needed, but for now, I'll focus on the rules).

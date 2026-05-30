# Security Specification & Invariants

## Data Invariants

1. **User Ownership Constraint**: Only the owner of a `/users/{userId}` document (where `{userId}` matches `request.auth.uid`) can read or write documents under that path, including the nested subcollections `galleries` and `transactions`.
2. **Credits Field Immutability**: The `credits` field on `/users/{userId}` is a system-controlled balance field. Users cannot arbitrarily self-increment it on their profile or bypass payments. Instead, it is updated securely under transactional constraints, and profile creation initializes it to a default free balance of 3 credits.
3. **Verified Sign-In Mandate**: Writes can only be executed by authenticated users with a verified email address (`request.auth.token.email_verified == true`).
4. **Gallery Content Boundaries**: Document IDs, gallery names, and other parameters are strictly shape-checked (e.g. `isValidId` for paths and limits on sizes) to prevent Wallet Abuse.

---

## The "Dirty Dozen" Spoof/Attack Payload Index

These 12 scenarios describe specific payloads that the Firestore fortress security rules must explicitly reject:

1. **Self-Awarded Credits Profile Creation**: Creating a profile with `credits: 1000` from the client SDK.
2. **Profile Credits Theft (Write-Gap)**: Updating user profile of another photographer to reduce their credits.
3. **Privilege Escalation (Shadow Admin Claims)**: Attempting to update a user doc with `"role": "admin"` or `"isAdmin": true`.
4. **Third-Party Profile Harvesting (Blanket Reads)**: Querying or getting all user emails or profiles in the system as an arbitrary logged-in user.
5. **Direct Arbitrary Gallery Insertion**: Creating a gallery doc under another photographer's user path without authorization.
6. **Gallery ID Poisoning Attack**: Submitting a 2MB binary key or junk character string as the `{galleryId}` document path name.
7. **Bypassing Paid Transaction Verification**: Creating a transaction record marked `status: 'completed'` directly to inject user credits.
8. **Shadow Transaction Ghost Fields**: Injecting an unapproved field `"chargebackStatus": "refunded"` into an existing transaction.
9. **Tampering with Relational Identity**: Altering the `id` of a gallery doc post-creation.
10. **Unauthenticated Read Access**: Accessing private gallery log directories without a valid login token.
11. **Spoofed Non-Verified Email Sign-In**: Writing user details with a custom token where `email_verified` is `false`.
12. **Denial of Wallet Recursion**: Hammering nested lookups or expensive list filters which would overflow memory boundaries.

---

## Test Verification Outline

Our security configurations located inside `/firestore.rules` are audited line-by-line to guarantee complete coverage of these invariants.

# Penny Security Specification

## 1. Data Invariants
1. Every user profile at `/users/{userId}` is strictly owned by `request.auth.uid == userId` with a verified email (`request.auth.token.email_verified == true`), and cannot be listed or read by any other user.
2. Every transaction, budget, and savings goal lives under `/users/{userId}/...`, requires the parent `/users/{userId}` document to exist, and enforces `ownerId == request.auth.uid == userId` immutably.
3. No client write may inject shadow fields (`keys().hasOnly(...)` on create, `affectedKeys().hasOnly(...)` on update), forge `createdAt`/`updatedAt` timestamps (`request.time`), exceed string length bounds, or store negative/zero limits and amounts.
4. Default-deny catch-all (`/{document=**}`) rejects any path not explicitly matched.

## 2. Adversarial "Dirty Dozen" Payloads (All Must Fail with PERMISSION_DENIED)
1. **Cross-user profile read**: User B attempts `get` on `/users/{userA}` -> DENIED (`!isOwner(userA)`).
2. **User collection list scraping**: User A attempts `list` on `/users` -> DENIED (`allow list: if false`).
3. **Unverified email write**: Unverified token (`email_verified: false`) attempts `create` on `/users/{uid}` -> DENIED.
4. **Shadow field on profile create**: `{ uid, displayName, email, currency: "USD", isAdmin: true, createdAt, updatedAt }` -> DENIED (`keys().hasOnly(...)`).
5. **Client-forged timestamp**: Transaction create with client `Date` instead of `request.time` -> DENIED (`incoming().createdAt == request.time`).
6. **Identity spoofing on transaction**: User B writes to `/users/{userB}/transactions/t1` with `ownerId: userA` -> DENIED (`data.ownerId == request.auth.uid`).
7. **Orphaned subcollection write**: Write to `/users/{uid}/transactions/t1` before `/users/{uid}` profile exists -> DENIED (`exists(/databases/$(database)/documents/users/$(userId))`).
8. **Immutable field mutation**: Update transaction attempting to change `ownerId` or `createdAt` -> DENIED (`affectedKeys().hasOnly(...)` + immutability check).
9. **ID poisoning**: Create document with 300-character ID or invalid characters (`../bad`) -> DENIED (`isValidId()`).
10. **Amount / type poisoning**: Transaction with `amount: -50` or `description: "<200 chars>"` or `type: "hacked"` -> DENIED (`isValidTransaction()`).
11. **Goal negative currentAmount**: Goal update setting `currentAmount: -10` -> DENIED (`data.currentAmount >= 0`).
12. **Budget invalid category**: Budget create with `category: "salary"` (income category) or `limit: 0` -> DENIED (`isValidBudget()`).

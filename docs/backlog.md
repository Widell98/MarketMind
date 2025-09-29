# Product Backlog

## Stub: Admin unlimited credits in `useSubscription`

- **Status:** Planned
- **Summary:** Ensure administrators bypass daily credit limits by enhancing the shared subscription hook with an admin capability check.
- **Key Tasks:**
  - Fetch admin status via `validate_admin_action` alongside existing subscription/usage queries.
  - Override credit gating helpers so admins always pass limit checks and see unlimited remaining usage.
  - Expose the admin flag for UI components such as `CreditsIndicator` to render ∞ credits or hide limits.
- **Impacted Files:**
  - `src/hooks/useSubscription.ts`
  - `src/components/CreditsIndicator.tsx`
  - Any UI surface that shows remaining credits/badges.
- **Notes:** Handle RPC failures gracefully by logging and falling back to non-admin behavior until a successful retry.


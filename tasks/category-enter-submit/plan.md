# Plan - Category Enter Submit

1. Introduce a ref for the create-category form in `components/dashboard/category-combobox.tsx` so we can trigger submission programmatically.
2. Add a keyboard handler on the creation input that intercepts Enter, prevents `cmdk` from hijacking it, and calls `requestSubmit` on the form (no-op while the mutation is pending).
3. Wire the ref and handler into the JSX, ensuring the existing click-based flow is untouched.
4. Validate TypeScript and lint if possible to catch regressions.

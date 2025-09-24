# Plan – Global Paste to Bookmark

1. **Stabilize submission helper** – Wrap `handleSubmit` in `useCallback` so it can be referenced safely from effects without re-subscribing listeners each render.
2. **Wire global paste listener** – Add a `useEffect` in `PrimaryInput` that listens for `paste` events on `document`, skips the handler when the event target is within editable fields, and otherwise extracts clipboard text.
3. **Normalize & create bookmark** – From the handler, trim the pasted text, take the first line, guard against empty strings or concurrent mutation, and reuse `handleSubmit` to create the bookmark. Prevent default to avoid inserting stray text into the page.
4. **Polish & test** – Ensure the command input and other text inputs retain native paste behavior, run Biome lint/check, and manually note pending follow-ups if testing is skipped.

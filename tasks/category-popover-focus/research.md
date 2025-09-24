# Research

## Findings
- `CategoryCombobox` opens a Radix `Popover` but never moves focus into the popover. After pressing Enter on the trigger, focus remains on the button, so pressing Tab leaves the popover and arrow keys do nothing because cmdk never gained focus.
- The `<Command>` component from `cmdk` is rendered without a ref. Cmdk expects focus on the root (or an input) to activate its roving focus listbox behaviour.
- Radix Popover does not trap focus by default (`modal=false`), so it won’t automatically focus the first focusable child—we must do it manually.
- INTERFACE.md requires keyboard parity with APG patterns; for a listbox-style combobox, focus should land on the list so users can use Arrow keys, with Tab to exit.
- Existing Button already has visible focus rings, so the missing piece is transferring focus to the command list when the popover opens.

## Existing patterns
- No other component in the repo currently implements manual focus handoff for cmdk; this pattern will need to be added here.

## Open questions
- Should we focus the first selectable item or the Command root? (Focusing the root lets cmdk highlight the current item automatically.)
- Do we need to restore focus manually on close, or will Radix handle it? (Radix returns focus to the trigger on close, so likely fine.)

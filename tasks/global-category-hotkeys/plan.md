# Implementation Plan: Global Category Hotkeys

## Overview
Enable global keyboard shortcuts (1-9) for category switching in the dashboard, extending the existing hotkey functionality that currently only works when the category combobox is open.

## Architecture Decision
Based on research, we'll use **Option 3: Custom Hook** approach:
- Extract hotkey logic into `useGlobalCategoryHotkeys` hook
- Use hook in `DashboardContent` component where category data is available
- Maintain existing CategoryCombobox behavior for when popover is open
- Ensure no conflicts between global and local hotkeys

## Implementation Steps

### Step 1: Create hooks directory and custom hook
- Create `lib/hooks/` directory
- Create `lib/hooks/use-global-category-hotkeys.ts`
- Extract and adapt hotkey logic from CategoryCombobox:
  - Copy event filtering logic (modifier keys, input elements)
  - Copy hotkey mapping logic (1-9,0 to categories)
  - Use callback pattern for category selection
  - Use refs for stable event handlers
  - Follow same patterns as CategoryCombobox

### Step 2: Hook Interface Design
```typescript
interface UseGlobalCategoryHotkeysOptions {
  categories: Category[];
  selectedId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  enabled?: boolean; // Allow disabling in certain contexts
}

function useGlobalCategoryHotkeys(options: UseGlobalCategoryHotkeysOptions): void
```

### Step 3: Integrate hook in DashboardContent
- Import and use the hook in `components/dashboard/dashboard-content.tsx`
- Pass categories data and selection handler
- Create category change handler that updates URL (same logic as CategoryCombobox)

### Step 4: Prevent conflicts with CategoryCombobox
- Modify CategoryCombobox to disable global hotkeys when popover is open
- Add `enabled: false` prop to hook when CategoryCombobox is active
- Ensure both systems don't compete for the same keystrokes

### Step 5: URL state management
- Extract URL update logic into reusable function
- Use same `useRouter` and `useSearchParams` pattern from CategoryCombobox
- Maintain existing behavior for cursor reset and parameter handling

## Detailed Implementation

### Hook Implementation (`lib/hooks/use-global-category-hotkeys.ts`)
```typescript
"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Category } from "@/lib/schemas";

const HOTKEY_SEQUENCE = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

interface UseGlobalCategoryHotkeysOptions {
	categories: Category[];
	selectedId: string | null;
	onCategoryChange: (categoryId: string | null) => void;
	enabled?: boolean;
}

export function useGlobalCategoryHotkeys({
	categories,
	selectedId,
	onCategoryChange,
	enabled = true,
}: UseGlobalCategoryHotkeysOptions) {
	// Logic extracted from CategoryCombobox
	// - Build options with "All" + categories
	// - Map to hotkeys
	// - Create stable event handler with refs
	// - Add/remove document event listener
}
```

### DashboardContent Integration
```typescript
// In components/dashboard/dashboard-content.tsx
import { useGlobalCategoryHotkeys } from "@/lib/hooks/use-global-category-hotkeys";

export function DashboardContent({ user, filter }: DashboardContentProps) {
	// Existing code...

	const handleCategoryChange = useCallback((categoryId: string | null) => {
		// URL update logic extracted from CategoryCombobox
	}, [/* deps */]);

	useGlobalCategoryHotkeys({
		categories,
		selectedId: filter.categoryId ?? null,
		onCategoryChange: handleCategoryChange,
		enabled: true, // Could be made conditional later
	});

	// Rest of component...
}
```

### CategoryCombobox Conflict Prevention
- Consider adding global state or context to track when popover is open
- Or use a simpler approach: let both systems coexist since they do the same thing
- The simpler approach is preferred for now since both handlers do identical actions

## Code Reuse Strategy
- Extract common logic into shared utilities if needed
- Reuse exact same event filtering patterns
- Reuse same hotkey sequence and mapping logic
- Maintain consistency with existing behavior

## Testing Considerations
- Test keyboard shortcuts work globally in dashboard
- Test no interference with form inputs
- Test CategoryCombobox hotkeys still work when popover is open
- Test modifier key combinations are ignored
- Test contentEditable elements are ignored

## Edge Cases Handled
- Input/textarea/contentEditable focus states
- Modifier key combinations
- Non-existent category mappings
- Component unmounting during event handling
- Multiple rapid keystrokes

## Performance Considerations
- Use refs to avoid recreating event handlers
- Memoize hotkey mappings
- Single document event listener (not per-category)
- Efficient event filtering to minimize unnecessary work

## Accessibility Compliance
- Maintain existing accessible patterns
- Don't interfere with screen readers or keyboard navigation
- Respect focus management patterns
- Keep visual hotkey indicators in CategoryCombobox

## Files to Modify/Create
1. **CREATE**: `lib/hooks/use-global-category-hotkeys.ts`
2. **MODIFY**: `components/dashboard/dashboard-content.tsx`
3. **POTENTIALLY CREATE**: `lib/hooks/index.ts` (for exports)

## Success Criteria
- ✅ Pressing 1-9 switches categories globally in dashboard
- ✅ No conflicts with existing CategoryCombobox hotkeys
- ✅ No interference with form inputs or contentEditable
- ✅ Maintains all existing accessibility patterns
- ✅ Follows established code patterns and guidelines
- ✅ Clean separation of concerns (UI vs business logic)

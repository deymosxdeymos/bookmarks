# AI Agent Guidelines - EduTeams

## Code Style
- **Formatting:** Biome
- **Imports:** Use `@/` alias for src/, organize imports automatically
- **Types:** Strict TypeScript, infer when possible, explicit for complex objects
- **Naming:** camelCase vars/functions, PascalCase components/types, kebab-case files
- **Components:** Server-first, `"use client"` only for interactivity
- **API:** Zod validation, error.tsx boundaries, HttpError classes

## React Rules
- Never fetch in Client Components - use Server Components
- Skip `useState` unless reactive, prefer variables/`useRef`
- Derive data, avoid `useEffect` except for external systems
- Wrap expensive components in `<Suspense>`
- Only mark `"use client"` when necessary

## UI Component Patterns
- Use shadcn/ui as the base component library
- Extend components with proper TypeScript interfaces
- Use `cn()` utility for conditional class names
- Implement proper accessibility attributes

## Form Components
- Use React Hook Form with Zod validation
- Implement proper error states
- Use controlled components
- Handle loading and submission states

## Data Display Components
- Use proper loading states
- Implement error boundaries
- Handle empty states gracefully
- Use proper data formatting

## Layout Components
- Create reusable layout patterns
- Use proper responsive design
- Implement proper spacing and typography
- Handle different screen sizes

## State Management in Components
- Use local state for UI state
- Use SWR for server state
- Implement proper loading states
- Handle error states appropriately

## Accessibility
- Use proper semantic HTML
- Implement proper ARIA attributes
- Ensure keyboard navigation
- Test with screen readers

## Performance
- Use React.memo for expensive components
- Implement proper key props for lists
- Use dynamic imports for large components
- Optimize re-renders

## Component Composition
- Prefer composition over inheritance
- Use render props when appropriate
- Create flexible component APIs
- Implement proper prop forwarding

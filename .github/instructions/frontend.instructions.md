# Frontend Instructions

## UI Libraries

### daisyUI

- Use **daisyUI 5** component classes for all UI components.
- daisyUI is already configured with Tailwind CSS 4.
- Prefer daisyUI semantic color names (`primary`, `secondary`, `accent`, `base-*`, `info`, `success`, `warning`, `error`) over Tailwind color names (`red-500`, `blue-600`) so colors adapt to themes automatically.
- Refer to the `daisyui.instructions.md` file for detailed component class names and usage patterns.

### Icons

- Use **react-icons** library for all icons.
- Import icons from specific icon sets to optimize bundle size:
  w

  ```tsxsw
  // Good - specific import
  import { MdPerson, MdSettings } from "react-icons/md";

  // Avoid - importing from root
  import { MdPerson } from "react-icons";
  ```

- Preferred icon sets (in order of preference):
  1. `md` - Material Design Icons (primary choice)
  2. `hi2` - Heroicons v2
  3. `lu` - Lucide Icons
- Use consistent icon sizing with Tailwind classes: `className="size-4"`, `className="size-5"`, etc.

---

## Component Organization

### Reusability Rules

1. **Check for existing components first** before creating new ones.
   - Look in `app/root/components/` for shared components.
   - Look in `app/<route>/_components/` for page-specific components that might be reusable.

2. **Create reusable components** when:
   - The component is used in multiple pages.
   - The component has no page-specific logic or dependencies.
   - Place these in: `app/root/components/`

3. **Create page-specific components** when:
   - The component is only used in one page/route.
   - The component has tight coupling to page-specific state or logic.
   - Place these in: `app/<route>/_components/`

### Folder Structure

```
app/
├── root/
│   └── components/           # Shared/reusable components
│       ├── Common/           # Generic UI components
│       ├── Tables/           # Table components
│       ├── Navigation/       # Navigation components
│       └── ...
├── [tenant]/
│   └── <page>/
│       ├── page.tsx          # Page composition only
│       └── _components/      # Page-specific components
```

### Component Guidelines

- **page.tsx** should only compose and arrange components - no large JSX blocks.
- Extract any substantial UI into `_components/` or `components/`.
- Name components descriptively: `UserProfileCard.tsx`, `TimeEntryForm.tsx`.
- One component per file (except tightly coupled sub-components).

---

## Component Patterns

### Buttons

```tsx
// Use daisyUI button classes with react-icons
import { MdAdd } from "react-icons/md";

<button className="btn btn-primary">
  <MdAdd className="size-4" />
  Add Item
</button>;
```

### Form Inputs

```tsx
// Combine daisyUI form classes with react-hook-form
<input
  type="text"
  className="input input-bordered"
  {...register("fieldName")}
/>
```

### Cards

```tsx
<div className="card bg-base-100 shadow-xl">
  <div className="card-body">
    <h2 className="card-title">Title</h2>
    <p>Content</p>
    <div className="card-actions justify-end">
      <button className="btn btn-primary">Action</button>
    </div>
  </div>
</div>
```

### Loading States

```tsx
// Use daisyUI loading component
<span className="loading loading-spinner loading-md"></span>
```

### Empty States

```tsx
// Create consistent empty states
import { MdInbox } from "react-icons/md";

<div className="flex flex-col items-center justify-center py-12 text-base-content/60">
  <MdInbox className="size-12 mb-4" />
  <p>{t("emptyState.message")}</p>
</div>;
```

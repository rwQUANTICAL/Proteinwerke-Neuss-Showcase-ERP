# Project Conventions

Please follow these conventions when implementing code in this project.

Use context 7 to find the latest documentation on project conventions.



## General

- Follow existing project patterns first. Prefer consistency over novelty.
- Keep code minimal, typed, and composable. Avoid duplicated logic.


---

## Code Structure

- If a user references a data object/model/entity, FIRST inspect `prisma/schema/domain.prisma` or `prisma/schema/auth.prisma` and align naming, relations, and fields to the schema.

- First check if there is code already there that can be used then decide if the code belongs to an entity or to a feature, put the code into lib/entity or feature accordingly


---

## Data Access & API Design

### Routes

- Any interaction with the data model MUST go through RESTful API routes.
  - Use Next.js Route Handlers: `app/api/<resource>/route.ts` (and nested routes like `app/api/<resource>/<id>/route.ts`).
  - Use standard HTTP verbs:
    - `GET` for reads, `POST` for create, `PUT/PATCH` for update, `DELETE` for delete.
  - Validate inputs using zod and return proper status codes.

### React Query (TanStack Query)

- Use `@tanstack/react-query` for all client-side data fetching/caching.Projekt bearbeiten

- Use:
  - `useQuery` for reads
  - `useMutation` for creates/updates/deletes
- When only a subset of query data is needed, use the `select` option to project the data.
- After mutations, invalidate/update the correct query keys.

- Look for existing queries in `lib/<Name>Querries.ts` before creating new ones. Reuse and compose existing queries when possible.

- Make sure to separate Querries that can be done by a owner of an organization(tenant) and member into separate files. For example, if you have a resource called `Project`, you can have `lib/ProjectQuerriesOwner.ts` and `lib/ProjectQuerriesMember.ts` to handle the different queries for owners and members.

### Centralize Queries

- All API calls and React Query logic MUST be refactored into `lib/<entity or feature>/<Name>/<Name>Hooks.ts` 
  - Export functions/hooks such as:
    - `fetch<Resource>()`
    - `use<Resource>Query()`
    - `useCreate<Resource>Mutation()`, `useUpdate...`, `useDelete...`
  - Define stable query keys and reuse them.

---

## Forms

- Use `react-hook-form` for forms.
  - Prefer `FormProvider` and reusable field components when appropriate.
  - Do not manage form state manually with `useState` when react-hook-form fits.
  - Integrate Zod with react-hook-form via `@hookform/resolvers/zod`:
    - Use `zodResolver(Schema)` in `useForm`.

---

## Components & Folder Structure

- Page-specific components:
  - Put them into the `_components` folder under the corresponding route, e.g.:
    - `app/<route>/_components/...`
- Global/shared components:
  - Put them into `app/components/...`
- `page.tsx` responsibilities:
  - Compose/arrange imported components.
  - MUST NOT contain large component implementations. No big JSX blocks; move them into `_components`.

---

# CLAUDE.md - Example Template

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an example Next.js application demonstrating feature-based architecture with route groups. The project uses Next.js 15 with TypeScript, Tailwind CSS, Drizzle ORM with PostgreSQL, and follows strict architectural patterns for component hierarchy and code organization.

**Key Features:**
- Feature-based architecture with route groups
- Strict component hierarchy and import order
- Custom hooks for logic separation
- React Context for state management (when prop drilling > 2 levels)
- Server Actions pattern for all server-side operations

## Development Commands

```bash
# Development
npm run dev                    # Start Next.js development server
npm run docker:local          # Start app + PostgreSQL using Docker Compose

# Building and Production
npm run build                  # Build the application
npm run start                  # Start production server
npm run lint                   # Run linter

# Testing
npm run test                   # Run tests
npm run test:watch            # Run tests in watch mode
npm run docker:test           # Full test cycle (start DB, run tests, stop DB)

# Database Operations
npm run db:generate           # Generate DB migrations
npm run db:migrate            # Run migrations
npm run db:push               # Push schema directly (development only)
npm run db:studio             # Open Drizzle Studio database browser
```

## Architecture & Code Organization

### Feature-Based Architecture with Route Groups

The application uses **route groups** (folders in parentheses) in `src/app/` to organize features by domain.

**Route groups are organizational folders that DON'T affect URL routing.**

#### Example Feature Structure

```
src/app/
├── (featureA)/               # Route group - doesn't affect URLs
│   ├── feature-route/
│   │   ├── (modules)/        # UI modules for this route
│   │   │   ├── FeatureForm.tsx
│   │   │   └── FeatureDisplay.tsx
│   │   ├── (hooks)/          # Custom hooks for this route
│   │   │   └── useFeatureData.ts
│   │   ├── actions.ts        # Server actions
│   │   ├── types.ts          # TypeScript types
│   │   └── page.tsx          # Route page component
│   ├── nested-route/
│   │   └── page.tsx
│   └── [dynamicId]/          # Dynamic route
│       └── page.tsx
│
├── (featureB)/
│   └── another-feature/
│       ├── (modules)/
│       ├── (context)/        # React context providers
│       │   └── FeatureContext.tsx
│       ├── actions.ts
│       └── page.tsx
│
├── (common)/                 # Shared functionality
│   └── (components)/
│       ├── Sidebar.tsx
│       └── Header.tsx
│
├── layout.tsx               # Root layout
├── page.tsx                 # Home page
└── globals.css              # Global styles
```

### Module Organization Patterns

#### Parentheses Convention
Folders in parentheses `()` are organizational and **don't affect URL routing**:
- `(featureName)` - Route group for organizing related routes
- `(modules)` - UI components specific to a route/feature
- `(hooks)` - Custom React hooks for logic separation
- `(context)` - React context providers for state management
- `(components)` - Shared UI components
- `(actions)` - Grouped server actions
- `(utils)` - Helper functions and utilities

#### Module Complexity Patterns
1. **Simple Modules**: Single component files in `(modules)` folders
2. **Complex Modules**: Self-contained folders with index files, partials, and related logic
3. **Feature Modules**: Complete modules with their own hooks, components, and sub-modules

### Component Hierarchy Rules ⭐

**Follow strict import order: app → feature → page → modules → component**

This is the **core architectural principle** of the project:

```
┌─────────────────────────────────────────┐
│  App (src/app/)                         │
│  ↓                                      │
│  Feature (route groups)                 │
│  ↓                                      │
│  Page (page.tsx)                        │
│  ↓                                      │
│  Modules (feature-specific UI)          │
│  ↓                                      │
│  Components (reusable UI primitives)    │
└─────────────────────────────────────────┘
```

**Hierarchy Rules:**
- **Pages** are made of modules
- **Modules** are made of components
- **Components** are reusable HTML/UI elements
- Components can import components
- Modules can import modules
- **Components CANNOT import modules** (breaks hierarchy)

**Why this matters:**
- Maintains clear separation of concerns
- Prevents circular dependencies
- Makes code predictable and maintainable
- Easier to test and refactor

### Code Organization Best Practices

#### 1. Use Component Folders for Organization
```typescript
// ✅ Good: Organized component with related files
src/app/(feature)/route/(modules)/ComplexForm/
  ├── ComplexForm.tsx         // Main component
  ├── index.ts                // Export
  ├── partials/               // Sub-components
  │   ├── FormSection1.tsx
  │   └── FormSection2.tsx
  └── __tests__/
      └── ComplexForm.test.tsx
```

#### 2. Use Custom Hooks to Separate Logic from UI
```typescript
// ✅ Good: Logic separated into custom hook
// (hooks)/useFeatureData.ts
export function useFeatureData(id: number) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData(id).then(setData).finally(() => setLoading(false));
  }, [id]);

  return { data, loading };
}

// (modules)/FeatureDisplay.tsx
export function FeatureDisplay({ id }: Props) {
  const { data, loading } = useFeatureData(id);

  if (loading) return <Loading />;
  return <div>{data.title}</div>;
}
```

#### 3. Use Context When Prop Drilling Exceeds 2 Levels
```typescript
// ❌ Bad: Prop drilling through 3+ levels
<ParentComponent>
  <MiddleComponent data={data}> {/* Level 1 */}
    <ChildComponent data={data}> {/* Level 2 */}
      <GrandchildComponent data={data} /> {/* Level 3 - TOO DEEP */}
    </ChildComponent>
  </MiddleComponent>
</ParentComponent>

// ✅ Good: Use Context instead
// (context)/FeatureContext.tsx
const FeatureContext = createContext<FeatureData | null>(null);

export function FeatureProvider({ children, data }: Props) {
  return (
    <FeatureContext.Provider value={data}>
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeature() {
  const context = useContext(FeatureContext);
  if (!context) throw new Error("useFeature must be used within FeatureProvider");
  return context;
}

// Usage
<FeatureProvider data={data}>
  <ParentComponent>
    <MiddleComponent>
      <ChildComponent>
        <GrandchildComponent /> {/* Access via useFeature() hook */}
      </ChildComponent>
    </MiddleComponent>
  </ParentComponent>
</FeatureProvider>
```

#### 4. Store Feature-Specific Code Within Feature Folders
```typescript
// ✅ Good: Feature-specific modules stay in feature folder
src/app/(userManagement)/users/
  ├── (modules)/
  │   ├── UserTable.tsx      // Only used by users feature
  │   └── UserForm.tsx
  ├── (hooks)/
  │   └── useUserData.ts     // Only used by users feature
  └── actions.ts

// ✅ Good: Global components go in /src/components
src/components/
  ├── Button.tsx             // Used across multiple features
  ├── Modal.tsx
  └── Table.tsx
```

### Global Directory Structure

```
src/
├── app/                    # Next.js App Router (feature-based organization)
├── components/             # Reusable React components (UI primitives)
├── hooks/                  # Custom React hooks (global logic)
├── repo/                   # Database schema (Drizzle ORM)
├── services/               # Business logic and external integrations
├── lib/                    # Utilities and configurations
├── types/                  # TypeScript type definitions
└── utils/                  # Helper functions
```

## Server Actions Pattern

All data mutations and server-side operations use Next.js Server Actions with the `"use server"` directive.

### Server Action Conventions

#### 1. File Structure
```typescript
// src/app/(feature)/route/actions.ts
"use server";

import { getDb } from "@/lib/db";
import { tableName } from "@/repo/schema";

export async function actionNameAction(params: ParamsType) {
  // Implementation
}
```

#### 2. Naming Convention
- All server actions end with `Action` suffix
- Use descriptive verbs: `createItemAction`, `updateItemAction`, `deleteItemAction`
- Group related actions in the same `actions.ts` file

#### 3. Standard Return Pattern
Always return an object with a `success` boolean and either data or error:

```typescript
// ✅ Success case
return {
  success: true,
  data: result,
};

// ✅ Error case
return {
  success: false,
  error: "User-friendly error message",
};
```

#### 4. Complete CRUD Example
```typescript
"use server";

import { getDb } from "@/lib/db";
import { items } from "@/repo/schema";
import { eq, desc } from "drizzle-orm";

// CREATE
export async function createItemAction(data: ItemData) {
  try {
    const [item] = await getDb()
      .insert(items)
      .values(data)
      .returning();

    return { success: true, item };
  } catch (error) {
    console.error("Error creating item:", error);
    return { success: false, error: "Failed to create item" };
  }
}

// READ (list)
export async function getItemsAction() {
  try {
    const allItems = await getDb()
      .select()
      .from(items)
      .orderBy(desc(items.createdAt));

    return { success: true, items: allItems };
  } catch (error) {
    console.error("Error fetching items:", error);
    return { success: false, error: "Failed to fetch items", items: [] };
  }
}

// READ (single)
export async function getItemAction(id: number) {
  try {
    const [item] = await getDb()
      .select()
      .from(items)
      .where(eq(items.id, id))
      .limit(1);

    if (!item) {
      return { success: false, error: "Item not found", item: null };
    }

    return { success: true, item };
  } catch (error) {
    console.error("Error fetching item:", error);
    return { success: false, error: "Failed to fetch item", item: null };
  }
}

// UPDATE
export async function updateItemAction(id: number, updates: Partial<ItemData>) {
  try {
    const [item] = await getDb()
      .update(items)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(items.id, id))
      .returning();

    return { success: true, item };
  } catch (error) {
    console.error("Error updating item:", error);
    return { success: false, error: "Failed to update item" };
  }
}

// DELETE
export async function deleteItemAction(id: number) {
  try {
    await getDb().delete(items).where(eq(items.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting item:", error);
    return { success: false, error: "Failed to delete item" };
  }
}
```

### Using Actions in Components

```typescript
"use client";

import { useState } from "react";
import { createItemAction } from "./actions";

export function ItemForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);

    const result = await createItemAction(data);

    if (result.success) {
      toast.success("Item created!");
      router.push(`/items/${result.item.id}`);
    } else {
      toast.error(result.error);
    }

    setIsLoading(false);
  };

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
}
```

## Database Architecture (Drizzle ORM + PostgreSQL)

### Schema Organization

All database tables are defined in `src/repo/schema.ts` using Drizzle ORM.

```typescript
import { pgTable, serial, text, integer, timestamp, vector } from "drizzle-orm/pg-core";

// Example table definition
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Foreign key relationships
export const itemDetails = pgTable("item_details", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id")
    .references(() => items.id, { onDelete: "cascade" })
    .notNull(),
  details: text("details"),
});

// Type exports
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
```

### Migration Workflow

```bash
# 1. Modify schema in src/repo/schema.ts

# 2. Generate migration
npm run db:generate

# 3. Review generated SQL in drizzle/ directory

# 4. Apply migration
npm run db:migrate

# Alternative: Push schema directly (dev only, no migration files)
npm run db:push
```

## Component Patterns

### Client Components
```typescript
"use client";

import { useState } from "react";

export function InteractiveComponent() {
  const [state, setState] = useState("");

  const handleAction = async () => {
    const result = await serverAction(data);
    if (result.success) {
      // Handle success
    }
  };

  return <div>{/* UI */}</div>;
}
```

### Server Components (Default)
```typescript
// No "use client" directive needed

import { getDb } from "@/lib/db";
import { items } from "@/repo/schema";

export default async function ItemListPage() {
  const items = await getDb().select().from(items);

  return <div>{/* Render items */}</div>;
}
```

## Development Workflow

### Creating a New Feature

```bash
# 1. Create feature route group
mkdir -p src/app/(newFeature)/feature-name

# 2. Create page and actions
touch src/app/(newFeature)/feature-name/page.tsx
touch src/app/(newFeature)/feature-name/actions.ts
touch src/app/(newFeature)/feature-name/types.ts

# 3. Create modules folder
mkdir src/app/(newFeature)/feature-name/(modules)

# 4. Create hooks folder if needed
mkdir src/app/(newFeature)/feature-name/(hooks)

# 5. Create context folder if needed (when prop drilling > 2 levels)
mkdir src/app/(newFeature)/feature-name/(context)

# 6. Update database schema if needed
# Edit src/repo/schema.ts

# 7. Generate and run migration
npm run db:generate
npm run db:migrate
```

### Example Feature Implementation

```typescript
// 1. Define schema (src/repo/schema.ts)
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;

// 2. Create page (src/app/(items)/items/page.tsx)
export default function ItemsPage() {
  return <div>Items List</div>;
}

// 3. Create actions (src/app/(items)/items/actions.ts)
"use server";

import { getDb } from "@/lib/db";
import { items } from "@/repo/schema";

export async function createItemAction(data: { title: string; content: string }) {
  try {
    const [item] = await getDb()
      .insert(items)
      .values(data)
      .returning();

    return { success: true, item };
  } catch (error) {
    return { success: false, error: "Failed to create item" };
  }
}

// 4. Create module (src/app/(items)/items/(modules)/ItemForm.tsx)
"use client";

import { createItemAction } from "../actions";

export function ItemForm() {
  const handleSubmit = async (e: FormEvent) => {
    const result = await createItemAction(data);
    if (result.success) {
      toast.success("Item created!");
    }
  };

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
}

// 5. Create hook if needed (src/app/(items)/items/(hooks)/useItemData.ts)
export function useItemData(id: number) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItem(id).then(setItem).finally(() => setLoading(false));
  }, [id]);

  return { item, loading };
}

// 6. Create context if prop drilling > 2 levels (src/app/(items)/items/(context)/ItemContext.tsx)
const ItemContext = createContext<Item | null>(null);

export function ItemProvider({ children, item }: Props) {
  return <ItemContext.Provider value={item}>{children}</ItemContext.Provider>;
}

export function useItem() {
  const context = useContext(ItemContext);
  if (!context) throw new Error("useItem must be used within ItemProvider");
  return context;
}
```

## Best Practices Summary

### ✅ DO

1. **Use route groups** to organize features
2. **Follow the component hierarchy** (app → feature → page → modules → component)
3. **Use custom hooks** to separate logic from UI
4. **Use React Context** when prop drilling exceeds 2 levels
5. **Name server actions** with `Action` suffix
6. **Return standard responses** from actions (`{ success, data/error }`)
7. **Keep feature code** within feature folders
8. **Extract reusable components** to `/src/components`
9. **Use TypeScript types** inferred from schema
10. **Handle errors gracefully** with user-friendly messages

### ❌ DON'T

1. **Don't let components import modules** (breaks hierarchy)
2. **Don't prop drill beyond 2 levels** (use Context instead)
3. **Don't put feature-specific code** in global folders
4. **Don't skip error handling** in server actions
5. **Don't expose technical errors** to users
6. **Don't mix client and server code** without directives
7. **Don't bypass the action pattern** for server operations

## Quick Reference

### Common Imports
```typescript
// Database
import { getDb } from "@/lib/db";
import { items } from "@/repo/schema";
import { eq, desc, sql } from "drizzle-orm";

// React
import { useState, useEffect, useContext, createContext } from "react";

// Next.js
import { redirect } from "next/navigation";
import Link from "next/link";

// Utils
import { cn } from "@/utils/cn";
```

### Directory Quick Reference
```
src/
├── app/                    # Features (route groups)
│   ├── (featureName)/     # Route group (doesn't affect URL)
│   │   └── route-name/
│   │       ├── (modules)/ # UI components
│   │       ├── (hooks)/   # Custom hooks
│   │       ├── (context)/ # React context
│   │       ├── actions.ts # Server actions
│   │       └── page.tsx   # Route page
│   ├── layout.tsx
│   └── page.tsx
├── components/             # Global reusable components
├── hooks/                  # Global custom hooks
├── repo/                   # Database schema
│   └── schema.ts
├── services/               # Business logic
├── lib/                    # Utilities
└── utils/                  # Helper functions
```

---

**Remember:** The key to maintainable code is following the **component hierarchy** and using **custom hooks** and **contexts** appropriately. When in doubt, separate logic from UI and keep components within their architectural boundaries.

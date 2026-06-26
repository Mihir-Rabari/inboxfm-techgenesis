---
name: inboxfm-design-system
description: "Use this skill whenever working on any UI, component, page, modal, form, button, input, or styling in the Inbox FM web app. Enforces the centralized design system: DS tokens, shared components, brand variants, and no legacy className overrides. Covers new pages, feature additions, component refactors, design audits, dark mode fixes, consistency passes, and animation work. Always read DESIGN.md before making any frontend changes."
---

# Inbox FM Design System Skill

> **Always read `/DESIGN.md` at the project root before touching any UI code.**
> It is the single source of truth for tokens, components, and rules.

---

## Step 0 — Load Context (Non-Negotiable)

Before any UI change, read these files in order:

1. **`/DESIGN.md`** — tokens, components, variants, rules
2. **`/apps/web/src/app/globals.css`** — live token values (the actual CSS variables)
3. The file(s) you are about to edit — to audit what's already there

Skip this and you will produce inconsistent output that a future agent will have to fix.

---

## The 3 Design System Layers

### Layer 1 — Tokens (`globals.css`)

All design decisions live as CSS variables. **Never hardcode a value that has a token.**

| Token | Value | What it controls |
|---|---|---|
| `--ds-radius-card` | `2rem` | Outer section cards, modals |
| `--ds-radius-inner` | `1.25rem` | Inputs, inner cards, SelectContent |
| `--ds-radius-pill` | `9999px` | Badges, chips, tags |
| `--ds-radius-btn` | `0.875rem` | Buttons |
| `--ds-shadow-card` | subtle oklch shadow | Default card resting shadow |
| `--ds-shadow-primary` | primary-colored glow | CTA button shadow |
| `--ds-shadow-hover` | elevated shadow | Card hover state |

**In Tailwind**: use `rounded-[var(--ds-radius-card)]` etc. Do NOT use `rounded-2xl`, `rounded-3xl`, or any raw value that maps to a token.

### Layer 2 — Base UI Components (`/apps/web/src/components/ui/`)

These are upgraded shadcn primitives with brand defaults baked in. They require **zero className overrides** for standard usage.

| Component | Key defaults | When to override |
|---|---|---|
| `<Button>` | `rounded-[var(--ds-radius-btn)]`, `active:scale-[0.97]` | Almost never |
| `<Input>` | `h-12`, borderless, `bg-muted/25`, `rounded-[var(--ds-radius-inner)]` | Font-weight only (`className="font-bold"`) |
| `<Textarea>` | Matches Input | `min-h-[Npx] resize-none` only |
| `<SelectTrigger>` | Matches Input exactly | `className="font-bold"` only |
| `<SelectContent>` | `rounded-[var(--ds-radius-inner)]`, no border, DS shadow | Almost never |
| `<Card>` | CVA variants: `default`, `glass`, `flat`, `ghost` | Use `variant=` prop |
| `<Dialog>` / `<DialogContent>` | Card radius, no border, layered shadow, slide+scale entrance | Use `size=` prop |

#### Button Variants & Sizes

```tsx
// Variants
<Button variant="default" />    // primary CTA (filled)
<Button variant="secondary" />  // secondary action
<Button variant="ghost" />      // icon button, nav item
<Button variant="outline" />    // bordered, low emphasis
<Button variant="destructive" /> // hard delete/disconnect
<Button variant="danger" />     // soft danger (border, hover fills red)

// Sizes
<Button size="brand" />    // h-12, uppercase, tracking-widest — main page CTAs
<Button size="default" />  // standard
<Button size="sm" />       // form actions, inline buttons
<Button size="icon" />     // square icon button
```

**Rule:** If you find yourself writing `className="h-12 rounded-2xl font-black text-xs uppercase tracking-widest px-8 shadow-lg shadow-primary/20 active:scale-[0.98]"` — stop. Use `size="brand"` instead.

#### Dialog Size Prop

```tsx
<DialogContent size="xs" />      // confirm dialogs, sm:max-w-xs
<DialogContent size="sm" />      // forms, sm:max-w-sm
<DialogContent size="default" /> // standard, sm:max-w-lg
<DialogContent size="lg" />      // detail views, sm:max-w-2xl
<DialogContent size="xl" />      // wide panels, sm:max-w-4xl
```

Never pass `rounded-[2rem] border-none shadow-2xl` to DialogContent — it already has these.

### Layer 3 — Shared Components (`/apps/web/src/components/shared/`)

These are domain-aware composition components. **Always use these before building your own equivalent.**

#### `<PageHeader>`

```tsx
<PageHeader
  title="Account Settings"
  description="Manage your personal information."
  action={<Button size="brand">Save</Button>}  // optional right slot
  className="mb-8"
/>
```

Replaces: manual `<h1 className="text-3xl font-black tracking-tight">` + `<p className="text-sm text-muted-foreground">` pattern.

#### `<SectionCard>`

```tsx
<SectionCard
  icon={<Gear size={22} weight="fill" />}
  title="Delivery Settings"
  description="Control when and how briefs are sent."
  action={<StatusBadge ... />}  // optional right slot
>
  <MyContent />
</SectionCard>
```

Replaces: `<div className="rounded-[2rem] glass p-6 md:p-8 shadow-sm hover:shadow-md transition-all">`.

#### `<LoadingScreen>`

```tsx
<LoadingScreen />                              // full min-h-dvh centered spinner
<LoadingScreen variant="inline" message="Loading briefs..." />  // inline
```

Replaces: `<div className="min-h-screen flex items-center justify-center"><Spinner /></div>`.

#### `<EmptyState>`

```tsx
<EmptyState
  icon={<FunnelSimple size={28} weight="duotone" />}
  title="No rules yet"
  description="Add a sender rule to customize your briefing stream."
  action={<Button>Add Rule</Button>}
/>
```

#### `<StatusBadge>`

```tsx
// For sender priority
<StatusBadge priority="CRITICAL" />
<StatusBadge priority="HIGH" />
<StatusBadge priority="NORMAL" />
<StatusBadge priority="LOW" />

// For brief status
<StatusBadge status="DELIVERED" />
<StatusBadge status="PROCESSING" dot />   // with live pulse dot
<StatusBadge status="FAILED" />

// Generic label
<StatusBadge label="3 Rules" priority="NORMAL" />
```

#### `<ConfirmDialog>`

```tsx
<ConfirmDialog
  open={showDelete}
  onOpenChange={setShowDelete}
  title="Delete this brief?"
  description="This action cannot be undone."
  onConfirm={handleDelete}
  variant="destructive"
  confirmLabel="Yes, delete"
/>
```

Replaces: `window.confirm()`. Never use `window.confirm()` in this codebase.

#### `<ModalShell>`

```tsx
<ModalShell
  open={open}
  onOpenChange={setOpen}
  icon={<Gear size={22} weight="fill" />}
  iconVariant="primary"        // primary | destructive | success | warning | neutral
  title="Edit Schedule"
  description="Update your delivery time and voice persona."
  size="default"               // xs | sm | default | lg | xl
  footer={
    <Button size="brand" className="w-full">Save Changes</Button>
  }
>
  <MyFormContent />
</ModalShell>
```

Use this for any **new modal** that needs an icon + title header. For edge-to-edge modals with custom section layouts (like BriefsList summary viewer), use `<DialogContent size="lg" className="p-0 overflow-hidden">` directly.

---

## Anti-Patterns to Actively Refuse

These are banned. If you see them, fix them. If you're about to write them, stop.

### ❌ Hardcoded radius on any container

```tsx
// BANNED
<div className="rounded-2xl ...">
<div className="rounded-[2rem] ...">
<DialogContent className="rounded-[2rem] border-none shadow-2xl">

// CORRECT
<div className="rounded-[var(--ds-radius-card)] ...">
<DialogContent size="lg">   // already has the radius
```

### ❌ Manual button styling

```tsx
// BANNED — 100% of these should be removed
className="h-12 rounded-2xl font-black text-xs uppercase tracking-widest px-8 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"

// CORRECT
size="brand"
```

### ❌ Manual input defaults

```tsx
// BANNED — already in the base component
className="h-12 rounded-2xl bg-muted/20 border-none focus-visible:ring-primary px-4 transition-all"

// CORRECT — nothing, or just:
className="font-bold"
```

### ❌ Manual danger button with hover classes

```tsx
// BANNED
className="text-red-600 hover:bg-red-500 hover:text-white border border-red-500/20"

// CORRECT
variant="danger"    // soft: border, hover fills
variant="destructive"  // hard: always filled red
```

### ❌ window.confirm()

```tsx
// BANNED
if (window.confirm("Are you sure?")) { ... }

// CORRECT
<ConfirmDialog ... />
```

### ❌ Manual loading screen

```tsx
// BANNED
<div className="min-h-screen flex items-center justify-center">
  <Spinner size={48} className="text-primary" />
</div>

// CORRECT
<LoadingScreen />
```

### ❌ Duplicate page header markup

```tsx
// BANNED
<header className="mb-8">
  <h1 className="text-3xl font-black tracking-tight mb-1">Settings</h1>
  <p className="text-sm text-muted-foreground font-medium">...</p>
</header>

// CORRECT
<PageHeader title="Settings" description="..." />
```

---

## Adding a New Page

Follow this template:

```tsx
"use client";

import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { EmptyState } from "@/components/shared/EmptyState";

export default function MyNewPage() {
  if (isLoading) return <LoadingScreen />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="max-w-3xl mx-auto pb-32"
    >
      <PageHeader
        title="Page Title"
        description="What this page does."
        className="mb-8"
      />

      <SectionCard
        icon={<MyIcon size={22} weight="fill" />}
        title="Section Name"
        description="What this section does."
      >
        {/* content */}
      </SectionCard>
    </motion.div>
  );
}
```

---

## Adding a New Modal

```tsx
// Simple form modal — use ModalShell
<ModalShell
  open={open}
  onOpenChange={setOpen}
  icon={<CalendarPlus size={22} weight="fill" />}
  iconVariant="primary"
  title="Create Schedule"
  description="Configure your daily briefing delivery."
  size="sm"
  footer={
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      <Button size="brand" className="flex-1" onClick={handleSubmit}>Save</Button>
    </>
  }
>
  <div className="space-y-4">
    <div className="grid gap-2">
      <Label>Schedule Name</Label>
      <Input placeholder="Morning Digest" className="font-bold" />
    </div>
  </div>
</ModalShell>

// Confirm dialog — always use ConfirmDialog
<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  title="Delete Schedule?"
  description="All delivery history will be lost."
  onConfirm={handleDelete}
  variant="destructive"
  confirmLabel="Delete"
/>
```

---

## Icon System

Always use **Phosphor Icons** (`@phosphor-icons/react`). Never use lucide-react for new code.

```tsx
import { Gear, Warning, CheckCircle, Trash } from "@phosphor-icons/react";

// Standard: fill weight for filled icons, duotone for empty states
<Gear size={22} weight="fill" />
<FunnelSimple size={28} weight="duotone" />   // empty states
<Warning size={20} weight="fill" className="text-amber-500" />
```

Do not use emoji as icons in the UI.

---

## Glass Morphism Rule

`glass` class (from globals.css) is a purposeful effect, not a default card style. It works best for:
- Floating elements (sidebar, floating save capsule)
- Elements overlaid on a background with visual complexity

For regular section cards: use `<SectionCard>` which handles its own glass treatment contextually.

---

## Animation Standards

All page-level motion uses this exact config:

```tsx
<motion.div
  initial={{ opacity: 0, y: 15 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
>
```

Never use `ease: "easeInOut"` or `ease: "linear"` for page transitions. The custom cubic `[0.23, 1, 0.32, 1]` is the brand curve (strong ease-out).

For staggered list items: `delay: index * 0.05` max. Keep stagger tight.

---

## Skill Chaining

This skill is the **entry point** for all Inbox FM frontend work. After reading DESIGN.md, you may also invoke:

| Situation | Companion skill |
|---|---|
| Need to audit/polish visual quality | `impeccable` |
| Need to think about animation decisions | `emil-design-eng` |
| Need bold/loud/quiet redesign pass | `impeccable bolder` / `impeccable quieter` |
| Need general frontend design intelligence | `design-taste-frontend` |

Always start here first — other skills apply globally, this skill knows the Inbox FM system specifically.

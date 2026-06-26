# Inbox FM — Design System Reference

> **For agents:** Read this file before touching any UI code.
> The design system skill at `.agents/skills/inboxfm-design-system/SKILL.md` uses this as its source of truth.

---

## Product Identity

**Inbox FM** is a premium AI audio briefing product. It reads your Gmail and generates a personalized spoken brief. The aesthetic is: *professional radio station meets premium SaaS tool.* Think dark, high-contrast, confident — not bubbly, not minimal-grey.

**Voice:** Calm, precise, authoritative. Copy is short and direct. No filler words.

**Do not:**
- Over-use orange (it's the brand accent, not the brand personality)
- Use gradient text (`background-clip: text`) — banned
- Use identical card grids — slop
- Use modals as a first thought — think inline first
- Use `window.confirm()` — ever

---

## Color System

The color system is defined in [`/apps/web/src/app/globals.css`](./apps/web/src/app/globals.css) using CSS custom properties and Tailwind v4 `@theme inline` blocks.

### Brand Primary

The primary color is a warm amber/orange oklch value. It is used **sparingly** — as accent only. Never flood a page with primary color.

```css
/* Light mode */
--primary: oklch(0.65 0.18 55);     /* warm amber */

/* Dark mode — slightly cooler, more legible */
--primary: oklch(0.7 0.17 52);
```

### Design Token Palette Usage

| Role | Use for |
|---|---|
| `primary` | CTAs, active states, key accents only |
| `foreground` | Body text |
| `muted-foreground` | Labels, secondary text, captions |
| `background` | Page background |
| `muted` | Subtle backgrounds (inputs, section dividers) |
| `border` | Separators |
| `destructive` | Danger/delete actions |

**Hardcoded semantic colors (ok to use):**
- `text-emerald-500` — success/connected states
- `text-amber-500` — warnings
- `text-blue-500` — info/neutral accent
- `text-red-500` — errors inline (not buttons — use `variant="destructive"` for buttons)

---

## Typography

Font: **Inter** (loaded via Google Fonts in layout.tsx)

| Usage | Classes |
|---|---|
| Page titles (h1) | `text-3xl font-black tracking-tight` |
| Section titles (h2) | `text-xl font-black tracking-tight` |
| Card titles | `text-sm font-black tracking-tight` |
| Body text | `text-sm font-medium` |
| Labels / overlines | `text-[10px] font-black uppercase tracking-widest` |
| Muted body | `text-sm text-muted-foreground font-medium` |
| Descriptions | `text-sm text-muted-foreground leading-relaxed` |

**Font weight convention:** `font-black` for titles/labels, `font-bold` for form inputs, `font-medium` for body, `font-semibold` for supporting text.

---

## Spacing & Radius System

All radius values are CSS variable tokens. **Never use raw Tailwind radius classes for structural elements.**

```css
/* Defined in globals.css */
--ds-radius-card:  2rem;       /* Outer section cards, modals, dialogs */
--ds-radius-inner: 1.25rem;    /* Inputs, SelectTrigger, inner cards, SelectContent */
--ds-radius-pill:  9999px;     /* Badges, chips, tags */
--ds-radius-btn:   0.875rem;   /* All buttons */
```

**In JSX:**
```tsx
className="rounded-[var(--ds-radius-card)]"   // section card
className="rounded-[var(--ds-radius-inner)]"  // input wrapper
className="rounded-[var(--ds-radius-pill)]"   // badge/tag
className="rounded-[var(--ds-radius-btn)]"    // button (auto via Button component)
```

### Shadow Tokens

```css
--ds-shadow-card:    /* subtle resting shadow for section cards */
--ds-shadow-primary: /* primary glow for CTA buttons */
--ds-shadow-hover:   /* elevated shadow for hovered cards */
```

---

## Component Library

### Two Categories

**`/apps/web/src/components/ui/`** — Upgraded shadcn primitives with brand defaults baked in.
**`/apps/web/src/components/shared/`** — Domain-aware composition components for Inbox FM.

---

### Base Components (`/ui/`)

#### Button

```tsx
import { Button } from "@/components/ui/button";

// Variants
<Button variant="default" />      // primary CTA (filled, primary bg)
<Button variant="secondary" />    // muted bg
<Button variant="ghost" />        // transparent, subtle hover
<Button variant="outline" />      // bordered
<Button variant="destructive" />  // red filled — hard delete
<Button variant="danger" />       // red border, fills on hover — soft danger

// Sizes
<Button size="brand" />    // h-12, uppercase, tracking-widest — main page CTAs
<Button size="default" />  // standard h-10
<Button size="sm" />       // h-8, form actions
<Button size="icon" />     // square icon button
```

All buttons have `active:scale-[0.97]` baked in. Never add it manually.

#### Input

```tsx
import { Input } from "@/components/ui/input";

// Default: h-12, borderless, muted bg, inner radius — no overrides needed
<Input placeholder="you@example.com" />

// Only acceptable className override:
<Input className="font-bold" />       // for form inputs that need weight
<Input className="opacity-60" disabled />  // for disabled read-only fields
```

#### Textarea

```tsx
import { Textarea } from "@/components/ui/textarea";

// Acceptable overrides: min-height and resize only
<Textarea className="min-h-[120px] resize-none" />
```

#### SelectTrigger

```tsx
import { SelectTrigger, SelectContent, SelectItem, Select, SelectValue } from "@/components/ui/select";

// SelectTrigger: matches Input defaults — h-12, borderless, inner radius
// SelectContent: inner radius + DS shadow, no border

<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="font-bold">  {/* only override needed */}
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="opt1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

#### Card

```tsx
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";

// Variants: default | glass | flat | ghost
<Card variant="glass" gap="default">
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>
```

#### Dialog / DialogContent

```tsx
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter, DialogClose
} from "@/components/ui/dialog";

// size prop: xs | sm | default | lg | xl
// Default already has: card radius, no border, premium shadow, blur overlay
// showCloseButton: boolean (default true)

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent size="sm">
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* content */}
    <DialogFooter>
      <Button size="brand" className="w-full">Submit</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Shared Components (`/shared/`)

#### PageHeader

Every page must start with this. No manual `<h1>` blocks.

```tsx
import { PageHeader } from "@/components/shared/PageHeader";

<PageHeader
  title="Account Settings"
  description="Manage your information and delivery preferences."
  action={<Button size="brand">Save</Button>}  // optional
  className="mb-8"
/>
```

#### SectionCard

Every logical section of a page (form group, settings group, info block) uses this.

```tsx
import { SectionCard } from "@/components/shared/SectionCard";

<SectionCard
  icon={<Gear size={22} weight="fill" />}
  title="Notifications"
  description="Control how and when you receive alerts."
  action={<StatusBadge priority="HIGH" />}   // optional
>
  {/* section content */}
</SectionCard>
```

#### LoadingScreen

```tsx
import { LoadingScreen } from "@/components/shared/LoadingScreen";

// Full-page (use as early return when isLoading)
if (isLoading) return <LoadingScreen />;

// Inline
<LoadingScreen variant="inline" message="Fetching briefs..." />
```

#### EmptyState

```tsx
import { EmptyState } from "@/components/shared/EmptyState";

<EmptyState
  icon={<FunnelSimple size={28} weight="duotone" />}
  title="No sender rules yet"
  description="Add rules to prioritize or exclude senders from your briefing."
  action={<Button size="sm">Add Rule</Button>}
/>
```

#### StatusBadge

```tsx
import { StatusBadge } from "@/components/shared/StatusBadge";

// Sender priority badges
<StatusBadge priority="CRITICAL" />
<StatusBadge priority="HIGH" />
<StatusBadge priority="NORMAL" />
<StatusBadge priority="LOW" />

// Brief delivery status badges
<StatusBadge status="DELIVERED" />
<StatusBadge status="PROCESSING" dot />    // live pulsing dot
<StatusBadge status="FAILED" />
<StatusBadge status="PENDING" />

// Generic label badge
<StatusBadge label="4 Rules" priority="NORMAL" />
```

#### ConfirmDialog

```tsx
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

// Always use instead of window.confirm()
<ConfirmDialog
  open={showConfirm}
  onOpenChange={setShowConfirm}
  title="Delete this schedule?"
  description="All delivery history for this schedule will be permanently removed."
  onConfirm={handleDelete}
  variant="destructive"        // or "default"
  confirmLabel="Delete Schedule"
  cancelLabel="Keep It"
/>
```

#### ModalShell

```tsx
import { ModalShell } from "@/components/shared/ModalShell";

// For any new modal with an icon+title header
<ModalShell
  open={open}
  onOpenChange={setOpen}
  icon={<CalendarPlus size={22} weight="fill" />}
  iconVariant="primary"          // primary | destructive | success | warning | neutral
  title="Create Schedule"
  description="Set your briefing delivery time and voice."
  size="sm"
  footer={<Button size="brand" className="w-full">Save</Button>}
>
  {/* form fields */}
</ModalShell>
```

---

## Page Template

Every new app page follows this structure:

```tsx
"use client";

import { motion } from "framer-motion";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";

export default function MyPage() {
  // --- guards ---
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="max-w-3xl mx-auto pb-32"    // or max-w-5xl for wide pages
    >
      <PageHeader title="..." description="..." className="mb-8" />

      <div className="space-y-8">
        <SectionCard icon={...} title="..." description="...">
          {/* section content */}
        </SectionCard>
      </div>
    </motion.div>
  );
}
```

---

## Modal Template

```tsx
// New form modal
<ModalShell
  open={open}
  onOpenChange={setOpen}
  icon={<MyIcon size={22} weight="fill" />}
  iconVariant="primary"
  title="Modal Title"
  description="What the user is about to do."
  size="sm"
  footer={
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      <Button size="brand" className="flex-1" disabled={saving} onClick={handleSubmit}>
        {saving ? <><Spinner size={16} /> Saving...</> : "Save Changes"}
      </Button>
    </>
  }
>
  <div className="space-y-4">
    <div className="grid gap-2">
      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
        Field Label
      </Label>
      <Input placeholder="..." className="font-bold" />
    </div>
  </div>
</ModalShell>
```

---

## Icon System

**Library:** Phosphor Icons only. Import from `@phosphor-icons/react`.

```tsx
import { Gear, Warning, Trash, CheckCircle } from "@phosphor-icons/react";

// Standard icon sizes
// 14px — badge/label icons
// 16px — inline text icons
// 18-22px — UI element icons (buttons, section headers)
// 24-28px — modal header icons
// 28-32px — empty state icons

// Weight convention
weight="fill"     // filled icons for active/selected states
weight="bold"     // bold for CTA buttons
weight="duotone"  // empty states, decorative
weight="regular"  // default, rarely used
```

Never use: lucide-react (for new code), emoji as icons, generic SVG without semantic meaning.

---

## Anti-Pattern Reference

> Every one of these has been found and fixed in this codebase. They will appear again unless this document is read first.

| Anti-pattern | Fix |
|---|---|
| `rounded-2xl` on a section card | `rounded-[var(--ds-radius-card)]` or use `<SectionCard>` |
| `rounded-[2rem]` on a `DialogContent` | Use `size="lg"` prop instead |
| `h-12 rounded-2xl bg-muted/20 border-none px-4` on `<Input>` | Nothing — it's the default now |
| `h-12 rounded-2xl bg-muted/20 border-none` on `<SelectTrigger>` | `className="font-bold"` only |
| `h-12 rounded-2xl font-black text-xs uppercase tracking-widest px-8 shadow-lg shadow-primary/20 active:scale-[0.98]` on `<Button>` | `size="brand"` |
| `hover:bg-red-500 hover:text-white text-red-600` on a ghost button | `variant="danger"` |
| `window.confirm("...")` | `<ConfirmDialog ... />` |
| `<div className="min-h-screen flex items-center justify-center"><Spinner /></div>` | `<LoadingScreen />` |
| `<h1 className="text-3xl font-black tracking-tight mb-1">` + `<p className="text-sm text-muted-foreground">` | `<PageHeader title="..." description="..." />` |
| `border-l-4 border-primary` on a card | Rewrite with background tint or no border accent |
| Gradient text (`background-clip: text`) | Use `text-primary` solid color |
| `window.open(...)` for internal navigation | `router.push(...)` |

---

## Installed Design Skills

Use these together for any frontend task in this project:

| Skill | When to use |
|---|---|
| `inboxfm-design-system` *(this project's skill)* | **First** — always load before any UI work. Knows the exact component API and token system. |
| `impeccable` | Visual audit, UX critique, polishing passes, redesign direction |
| `impeccable bolder` | When the UI is too safe/bland and needs more personality |
| `impeccable quieter` | When it's too loud, too orange, or too cluttered |
| `impeccable animate` | Adding meaningful motion and micro-interactions |
| `impeccable polish` | Final pre-ship quality pass |
| `emil-design-eng` | Animation decisions, component feel, micro-interaction philosophy |
| `design-taste-frontend` | Landing page, marketing, brand-register surfaces |

### Workflow for new UI work

```
1. Read DESIGN.md                         ← you are here
2. Load inboxfm-design-system skill
3. Read the file(s) you'll edit
4. Build using the component templates above
5. Run: pnpm --filter web exec tsc --noEmit   ← verify zero TS errors
6. Run: pnpm --filter web run lint            ← verify no lint warnings
7. Commit with a descriptive message
```

---

## File Map

```
apps/web/src/
├── app/
│   ├── globals.css                  ← ALL design tokens live here
│   ├── page.tsx                     ← Main Inbox FM Landing Page (with inline waitlist)
│   └── inboxfm/
│       ├── dashboard/page.tsx       ← uses PageHeader, SectionCard, LoadingScreen
│       ├── settings/page.tsx        ← uses PageHeader, SectionCard, StatusBadge, EmptyState
│       ├── profile/page.tsx         ← uses PageHeader, LoadingScreen
│       ├── summaries/page.tsx       ← uses PageHeader, EmptyState, LoadingScreen
│       ├── support/page.tsx         ← uses PageHeader
│       └── feedback/page.tsx        ← uses PageHeader
├── components/
│   ├── ui/                          ← upgraded shadcn primitives (touch rarely)
│   │   ├── button.tsx               ← brand variants + sizes
│   │   ├── input.tsx                ← h-12 borderless defaults
│   │   ├── card.tsx                 ← glass/flat/ghost variants
│   │   ├── textarea.tsx             ← matches input
│   │   ├── select.tsx               ← SelectTrigger matches input
│   │   └── dialog.tsx               ← size prop, brand overlay, premium shadow
│   └── shared/                      ← domain components (use these first)
│       ├── PageHeader.tsx
│       ├── SectionCard.tsx
│       ├── LoadingScreen.tsx
│       ├── EmptyState.tsx
│       ├── StatusBadge.tsx
│       ├── ConfirmDialog.tsx
│       └── ModalShell.tsx
```

---

## Marketing & Conversion Guidelines

### High-Converting Inline Waitlists
- Provide waitlist capture directly on the landing page inline (`InlineWaitlistForm`). Do not redirect users to standalone pages unless necessary as fallbacks.
- Submissions must invoke `api.waitlist.join` and animate to a checkmarked glass card success state.
- Keep helper copy reassuring (OAuth read-only transparency, limited wave access description) directly under forms to build trust.

### Premium Scrollytelling
- Utilize step-by-step interactive animations (`ScrollytellingAnimations.tsx`) describing the setup lifecycle.
- Keep simulation states clean: messy logs -> active synthesis -> clean readable outcome.

---

*Last updated: 2026-06-05 after root landing page migration & inline waitlist updates*


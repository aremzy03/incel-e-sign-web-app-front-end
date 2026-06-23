---
name: Incel E-Sign
colors:
  surface: '#F1F5F9'
  surface-dim: '#dbd9dc'
  surface-bright: '#fbf8fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f6'
  surface-container: '#efedf0'
  surface-container-high: '#eae7eb'
  surface-container-highest: '#e4e2e5'
  on-surface: '#1b1b1e'
  on-surface-variant: '#45464e'
  inverse-surface: '#303033'
  inverse-on-surface: '#f2f0f3'
  outline: '#75777f'
  outline-variant: '#c5c6cf'
  surface-tint: '#4f5e81'
  primary: '#041534'
  on-primary: '#ffffff'
  primary-container: '#1b2a4a'
  on-primary-container: '#8392b7'
  inverse-primary: '#b7c6ee'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#211300'
  on-tertiary: '#ffffff'
  tertiary-container: '#3c2600'
  on-tertiary-container: '#ae8c5b'
  error: '#DC2626'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#b7c6ee'
  on-primary-fixed: '#0a1a3a'
  on-primary-fixed-variant: '#384668'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#ffddb0'
  tertiary-fixed-dim: '#e7c08b'
  on-tertiary-fixed: '#281800'
  on-tertiary-fixed-variant: '#5c4218'
  background: '#fbf8fc'
  on-background: '#1b1b1e'
  surface-variant: '#e4e2e5'
  primary-hover: '#243656'
  primary-light: '#EEF1F7'
  accent-hover: '#0F766E'
  accent-light: '#CCFBF1'
  success: '#059669'
  success-light: '#D1FAE5'
  warning: '#D97706'
  warning-light: '#FEF3C7'
  error-light: '#FEE2E2'
  info: '#2563EB'
  info-light: '#DBEAFE'
  bg: '#F8FAFC'
  border: '#E2E8F0'
  muted: '#64748B'
  body: '#1E293B'
  status-draft: '#94A3B8'
  status-pending: '#F59E0B'
  status-completed: '#059669'
  status-rejected: '#DC2626'
  status-your-turn: '#0D9488'
typography:
  headline-3xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-2xl:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
  headline-xl:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  caption-xs:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-xs:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '6': 24px
  '8': 32px
  '12': 48px
  '16': 64px
  sidebar-width: 240px
  topbar-height: 64px
  max-content-width: 1280px
---

# Incel E-Sign — Design System

**Version:** 1.0.0  
**Product:** Incel E-Sign (Electronic Signature Platform)  
**Audience:** Frontend engineers, UI contributors, Cursor prompt authors  
**Stack:** Next.js 15 · Tailwind CSS v4 · shadcn/ui primitives  

---

## 1. Brand Identity

### Personality

Incel E-Sign sits at the intersection of legal seriousness and modern SaaS usability. The product handles binding documents — contracts, NDAs, offer letters — so it must feel trustworthy and authoritative without being cold or bureaucratic.

| Trait | Expression |
|---|---|
| Trustworthy | Deep navy primary, clean whitespace, no decorative noise |
| Efficient | Dense-but-readable tables, clear CTAs, minimal confirmation steps |
| Legally serious | Signer timelines, audit trails, explicit status labeling |
| Not intimidating | Teal accents for "your turn", friendly empty states, human-readable timestamps |

---

## 2. Color Tokens

### Primary Brand

```css
--color-primary:        #1B2A4A;   /* Deep navy — headers, primary buttons, sidebar */
--color-primary-hover:  #243656;   /* Hover state for primary interactive elements */
--color-primary-light:  #EEF1F7;   /* Tinted surface for selected rows, highlights */
```

### Accent

```css
--color-accent:         #0D9488;   /* Teal — CTAs, "Your Turn" badge, focus rings */
--color-accent-hover:   #0F766E;   /* Darker teal on hover */
--color-accent-light:   #CCFBF1;   /* Light teal — badge backgrounds, success fills */
```

### Semantic

```css
--color-success:        #059669;   /* Completed status, positive confirmations */
--color-success-light:  #D1FAE5;
--color-warning:        #D97706;   /* Pending actions, expiry alerts */
--color-warning-light:  #FEF3C7;
--color-error:          #DC2626;   /* Rejected status, destructive actions */
--color-error-light:    #FEE2E2;
--color-info:           #2563EB;   /* Informational toasts, help links */
--color-info-light:     #DBEAFE;
```

### Neutral Scale

```css
--color-bg:             #F8FAFC;   /* Page background */
--color-surface:        #F1F5F9;   /* Card backgrounds, table header fills */
--color-border:         #E2E8F0;   /* All dividers, input borders, table rules */
--color-muted:          #64748B;   /* Supporting text, labels, metadata */
--color-body:           #1E293B;   /* Primary readable text */
--color-white:          #FFFFFF;   /* Card faces, modal backgrounds */
```

### Document Status Colors

```css
--status-draft:         #94A3B8;   /* Slate — not yet sent */
--status-pending:       #F59E0B;   /* Amber — awaiting signatures */
--status-completed:     #059669;   /* Green — fully executed */
--status-rejected:      #DC2626;   /* Red — declined by a signer */
--status-your-turn:     #0D9488;   /* Teal — current user must act */
```

---

## 3. Typography

### Font Stack

```css
--font-ui: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Type Scale

| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `text-xs` | 12px | 16px | 400/500 | Captions, badge labels, timestamps |
| `text-sm` | 14px | 20px | 400/500 | Secondary body, table cells, helpers |
| `text-base` | 16px | 24px | 400 | Primary body copy |
| `text-lg` | 20px | 28px | 600 | Card titles, section subheadings |
| `text-xl` | 24px | 32px | 600 | Page subheadings |
| `text-2xl` | 30px | 36px | 700 | Page headings (h1 on detail pages) |
| `text-3xl` | 36px | 44px | 700 | Dashboard hero headings |

---

## 4. Spacing

Base unit: **4px**.

```css
--space-1:   4px;
--space-2:   8px;
--space-3:  12px;
--space-4:  16px;
--space-6:  24px;
--space-8:  32px;
--space-12: 48px;
--space-16: 64px;
```

---

## 5. Shape & Elevation

### Border Radius

```css
--radius-sm:   4px;
--radius-md:   6px;
--radius-lg:   8px;
--radius-xl:  12px;
--radius-full: 9999px;
```

### Shadows

```css
--shadow-card:   0 1px 3px rgba(0, 0, 0, 0.08);
--shadow-raised: 0 4px 12px rgba(0, 0, 0, 0.10);
--shadow-modal:  0 8px 32px rgba(0, 0, 0, 0.14);
--shadow-focus:  0 0 0 2px #0D9488;
```

---

## 6. Component Patterns

Includes specifications for Buttons, Status Badges, Cards, Data Tables, Empty States, Toasts, Modals, Slide-Overs, PDF Viewer Chrome, Progress Steppers, Signer Timelines, and File Upload Dropzones.

---

## 7. Layout

### Page Shell

```
Sidebar:    240px fixed, bg: --color-primary, text: white
Main:       flex-1, bg: --color-bg
Top bar:    64px height, bg: white, border-bottom: --color-border
Content:    max-width 1280px, margin: 0 auto, padding: space-8
```

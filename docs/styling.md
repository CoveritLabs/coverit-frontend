# Styling Guide — SCSS Modules

## Setup

SCSS is compiled natively by Vite — no extra plugins needed.
Sass is installed as a dev dependency (`sass`).

## Rules

1. **Global styles** belong in `src/styles/` — imported once in `main.tsx`.
2. **Component styles** use `.module.scss` files co-located with the component.
3. Components reference **CSS custom properties** (`var(--color-brand)`) — never raw SCSS token variables. This enables theming.
4. SCSS token variables (`$color-brand-500`) are used only inside `src/styles/` partials.

## SCSS File Structure

```
src/styles/
├── _tokens.scss        Design token variables (palette, spacing, radii, shadows, typography)
├── _reset.scss         CSS reset
├── _typography.scss    Global font imports and heading scale
├── _mixins.scss        Reusable mixins
├── _animations.scss    Global keyframes + utility classes
├── themes/
│   ├── _light.scss     Light theme CSS custom properties
│   └── _dark.scss      Dark theme CSS custom properties
└── index.scss          Barrel — the ONLY file imported in main.tsx
```

## Writing a Component Style

```scss
// src/components/ui/Button/Button.module.scss
@use '@styles/tokens' as *;           // SCSS variables
@use '@styles/mixins' as *;            // Mixins

.button {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-4;
  border-radius: $radius-md;
  font-weight: $font-weight-medium;
  font-size: $font-size-sm;
  transition: background-color $transition-fast;

  // Use CSS vars for theme-aware colors
  background-color: var(--color-brand);
  color: var(--color-text-on-brand);

  &:hover {
    background-color: var(--color-brand-hover);
  }

  &:focus-visible {
    @include focus-ring;
  }
}

.button--outline {
  background-color: transparent;
  border: 1px solid var(--color-brand);
  color: var(--color-brand);
}
```

```tsx
// Button.tsx
import styles from './Button.module.scss'
import { cn } from '@utils/cn'

type Variant = 'solid' | 'outline'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'solid', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(styles.button, variant === 'outline' && styles['button--outline'], className)}
      {...props}
    />
  )
}
```

## Theming

The active theme is applied by setting `data-theme` on `<html>`:

```ts
// Via the useTheme hook
const { setTheme } = useTheme()
setTheme('dark') // → document.documentElement.setAttribute('data-theme', 'dark')
```

CSS vars in `themes/_light.scss` apply by default (`:root`).
CSS vars in `themes/_dark.scss` apply when `[data-theme="dark"]` is set.

## Using Mixins

```scss
@use '@styles/mixins' as *;

.sidebar {
  @include flex-column;
  @include custom-scrollbar;

  @include respond-to('lg') {
    width: 260px;
  }
}
```

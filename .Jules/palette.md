## 2024-05-23 - Radix Slider Accessibility
**Learning:** The default Radix UI `Slider` component wrapper (shadcn/ui style) in this repo did not pass `aria-label` to the `SliderPrimitive.Thumb`. This made single-thumb sliders (like seek bars and volume) invisible to screen readers unless they had an external visible label.
**Action:** Always verify reusable UI components support necessary ARIA attributes on their interactive elements (like `Thumb`), not just the root container.

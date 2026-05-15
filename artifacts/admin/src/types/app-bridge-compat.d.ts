// @shopify/app-bridge-types augments React.ButtonHTMLAttributes<T> with a
// Shopify-specific `variant` property ('primary' | 'breadcrumb' | null).
// This conflicts with shadcn/radix-ui components that define their own
// `variant` prop with a different set of values.
//
// Widening the augmented `variant` to `string` here neutralises the conflict
// while still allowing Shopify's custom elements to function correctly.
//
// `export {}` makes this a module file so that `declare module` is treated as
// an augmentation rather than an ambient replacement.
export {};

declare module "react" {
  interface ButtonHTMLAttributes<T> {
    variant?: string | null | undefined;
  }
}

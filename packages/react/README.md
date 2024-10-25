# Stylefusion

Stylefusion CSS is a zero-runtime CSS-in-JS library that extracts the colocated styles to their own CSS files at build time.

## Why?

Mantine 7 was created with CSS Modules, which many consider a step back from CSS-in-JS.  Which was used with Mantine 6.  CSS-in-JS gives you many benefits such as:-

- Colocated styles
- Build time extraction of styles to CSS files
- Build time theme variables
- Atomic css in production (will be finalised in future relase)

## Getting started

Stylefusion only supports Vite.

### Installation

<!-- #default-branch-switch -->

```bash
pnpm install @stylefusion/react
pnpm install --save-dev @stylefusion/vite-plugin
```

### Credits

Stylefusion is a forked version of [Pigment CSS](https://pigmentcss.dev/).  All credits go to the original MUI team.

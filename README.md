# Stylefusion

Stylefusion CSS is a zero-runtime CSS-in-JS library that extracts the colocated styles to their own CSS files at build time.

## Why?

Mantine 6 used CSS-in-JS and with the release of 7 they switched to CSS Modules.  CSS Modules are great for small projects, but they don't offer the same benefits as CSS-in-JS.  Such as:-

- Colocated styles
- Build time extraction of styles to CSS files
- Build time theme variables
- Includes the functions contained in [postcss-preset-mantine](https://github.com/mantinedev/postcss-preset-mantine)
- Atomic css in production (will be finalised in future relase)

## Getting started

Stylefusion only supports Vite.

## Installation

<!-- #default-branch-switch -->

```bash
pnpm install @stylefusion/react
pnpm install --save-dev @stylefusion/vite-plugin
```

## Roadmap
- [ ] fork non-native code from javascript to rust when react compiler replaces wyw-in-js.
- [ ] Extend build process to include styles param objects that use Emotion.

### Credits

Stylefusion is a forked version of [Pigment CSS](https://pigmentcss.dev/).  

All credits go to the original MUI team.

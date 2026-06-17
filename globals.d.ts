// Allow side-effect CSS imports (e.g. `import "./globals.css"`) to type-check
// under a bare `tsc --noEmit`. Next.js handles the actual CSS at build time.
declare module "*.css";

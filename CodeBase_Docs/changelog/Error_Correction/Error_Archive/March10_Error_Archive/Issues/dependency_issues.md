# Dependency Issues Analysis

## Missing Dependencies

The following dependencies are used in the codebase but not listed in package.json:

1. **lodash** - Used in `./src/utils/state/contextSelectors.ts`
2. **@testing-library/react-hooks** - Used in `./src/tests/hooks/factory/hookFactories.test.tsx`
3. **eventemitter3** - Used in `./src/managers/weapons/AdvancedWeaponEffectManager.ts`
4. **geojson** - Used in `./src/components/ui/showcase/DataDashboardApp.tsx`
5. **d3-scale** - Used in `./src/components/exploration/visualizations/charts/PredictionVisualization.tsx`
6. **d3-scale-chromatic** - Used in `./src/components/exploration/visualizations/charts/PredictionVisualization.tsx`

## Unused Dependencies

The following dependencies are listed in package.json but not used in the codebase:

1. **@pixi/particle-emitter** - No usage found in current codebase
2. **pixi-spine** - No usage found in current codebase
3. **three-mesh-bvh** - No usage found in current codebase
4. **xstate** - No usage found in current codebase

## Unused DevDependencies

The following dev dependencies are listed in package.json but not used:

1. **@babel/parser**
2. **@testing-library/dom**
3. **@types/jest**
4. **@types/styled-jsx**
5. **@typescript-eslint/eslint-plugin**
6. **@typescript-eslint/parser**
7. **@vitest/coverage-v8**
8. **autoprefixer**
9. **eslint-import-resolver-alias**
10. **eslint-import-resolver-typescript**
11. **eslint-plugin-import**
12. **eslint-plugin-jsx-a11y**
13. **eslint-plugin-react**
14. **eslint-plugin-react-hooks**
15. **eslint-plugin-react-refresh**
16. **eslint-plugin-simple-import-sort**
17. **glob**
18. **globals**
19. **gsap**
20. **husky**
21. **jest**
22. **postcss**
23. **prettier-plugin-organize-imports**
24. **prettier-plugin-tailwindcss**
25. **rimraf**
26. **sharp**
27. **tailwindcss**
28. **ts-jest**
29. **typescript-plugin-css-modules**
30. **vite-tsconfig-paths**

## Peer Dependency Issues

Based on the npm ls output, the following peer dependencies appear to be properly installed:

1. **@emotion/react** - Required by @mui/material
2. **@emotion/styled** - Required by @mui/material

## Recommended Actions

1. Install missing dependencies:
   ```bash
   npm install lodash eventemitter3 geojson d3-scale d3-scale-chromatic
   npm install --save-dev @testing-library/react-hooks
   ```

2. Remove unused dependencies:
   ```bash
   npm uninstall @pixi/particle-emitter pixi-spine three-mesh-bvh xstate
   ```

3. Consider cleaning up unused dev dependencies:
   ```bash
   npm uninstall @babel/parser @testing-library/dom @types/jest @types/styled-jsx @typescript-eslint/eslint-plugin @typescript-eslint/parser @vitest/coverage-v8 autoprefixer eslint-import-resolver-alias eslint-import-resolver-typescript eslint-plugin-import eslint-plugin-jsx-a11y eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh eslint-plugin-simple-import-sort glob globals gsap husky jest postcss prettier-plugin-organize-imports prettier-plugin-tailwindcss rimraf sharp tailwindcss ts-jest typescript-plugin-css-modules vite-tsconfig-paths
   ```
   
   Note: Some of these may be used in configuration files or scripts, so review carefully before removing.

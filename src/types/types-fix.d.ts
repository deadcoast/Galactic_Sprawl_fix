/// <reference types="css-font-loading-module" />

/**
 * Fix for conflicting type declarations between @types/css-font-loading-module and lib.dom.d.ts
 *
 * This overrides the conflicting definitions without requiring moduleResolution changes.
 */
interface FontFaceSet {
  onloading: (this: FontFaceSet, ev: FontFaceSetLoadEvent) => void;
  onloadingdone: (this: FontFaceSet, ev: FontFaceSetLoadEvent) => void;
  onloadingerror: (this: FontFaceSet, ev: FontFaceSetLoadEvent) => void;
}

/**
 * Fix for missing rollup/parseAst module
 */
declare module 'rollup/parseAst' {
  export interface Node {
    type: string;
    [key: string]: unknown;
  }

  export interface ParseOptions {
    ecmaVersion?: number;
    sourceType?: 'module' | 'script';
  }

  export function parseAst(code: string, options?: ParseOptions): Node;
  export default parseAst;
}

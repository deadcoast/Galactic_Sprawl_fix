/**
 * Custom type declarations to fix conflicts in third-party libraries
 */

// Fix for css-font-loading-module type conflicts
declare module '@types/css-font-loading-module' {
  interface FontFaceSet {
    // Fix FontFaceSet event handler types
    onloading: ((this: FontFaceSet, ev: FontFaceSetLoadEvent) => void) | null;
    onloadingdone: ((this: FontFaceSet, ev: FontFaceSetLoadEvent) => void) | null;
    onloadingerror: ((this: FontFaceSet, ev: FontFaceSetLoadEvent) => void) | null;
  }
}

// Add any other type fixes here as needed

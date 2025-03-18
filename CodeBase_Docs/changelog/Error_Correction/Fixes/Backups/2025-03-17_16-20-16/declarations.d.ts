/**
 * Custom type declarations to fix conflicts in third-party libraries
 */

// Fix for css-font-loading-module type conflicts
declare module '@types/css-font-loading-module' {
  interface FontFaceSet {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onloading: ((this: FontFaceSet, ev: FontFaceSetLoadEvent) => any) | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onloadingdone: ((this: FontFaceSet, ev: FontFaceSetLoadEvent) => any) | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onloadingerror: ((this: FontFaceSet, ev: FontFaceSetLoadEvent) => any) | null;
  }
}

// Add any other type fixes here as needed

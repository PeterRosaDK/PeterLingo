// cubing.js keeps its MIT-licensed min2phase implementation in an internal, versioned chunk.
// Pinning this adapter to the lockfile version lets Vite bundle it inside our own worker instead
// of relying on cubing.js's nested-worker fallback, which Vite cannot currently rewrite safely.
// @ts-expect-error cubing.js does not publish declarations for this internal implementation.
export { solvePattern } from '../../../node_modules/cubing/dist/lib/cubing/chunks/search-dynamic-solve-3x3x3-B2L4IN34.js';

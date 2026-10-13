import { register } from "node:module";

// `server-only` is resolved by Next's bundler and is not installed as a package, so outside Next
// (node:test) it would not resolve. The marker has no behaviour to test: resolve it to nothing.
register("./server-only-loader.mjs", import.meta.url);

import { build } from "esbuild";

await build({
  entryPoints: ["widget-src/index.ts"],
  bundle: true,
  minify: true,
  format: "iife",
  outfile: "public/widget.js",
  target: ["es2017"],
  platform: "browser",
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  logLevel: "info",
});

console.log("✓ Widget built to public/widget.js");

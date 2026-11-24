// SPDX-License-Identifier: MIT
// post-x-promote-make-your-own-bounty-01
// Entry program: ships the X post (POST.json) that promotes make.fun's
// make-your-own-bounty feature. It validates POST.json at the repo root
// (the bot dir) and copies it into the output dir, byte for byte.
//
// Env overrides (defaults shown):
//   MAKEFUN_BOT_DIR=/bot        repo root mounted for the run
//   MAKEFUN_OUTPUT_DIR=/output  where the deliverable is written
import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const botDir = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

const src = join(botDir, "POST.json");
const dest = join(outDir, "POST.json");

function fail(message: string, err?: unknown): never {
  console.error(`ERROR: ${message}`);
  if (err !== undefined) console.error(err);
  process.exit(1);
}

try {
  // 1. The source must exist and be a regular file.
  const stat = statSync(src);
  if (!stat.isFile()) fail(`${src} is not a regular file`);
  console.log(`Found ${src} (${stat.size} bytes)`);

  // 2. It must be valid JSON with a string `url` field pointing at an X post.
  const parsed: unknown = JSON.parse(readFileSync(src, "utf8"));
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    fail(`${src} must contain a JSON object`);
  }
  const url = (parsed as Record<string, unknown>).url;
  if (typeof url !== "string" || url.length === 0) {
    fail(`${src} must contain a non-empty string "url" field`);
  }
  if (!/^https:\/\/x\.com\//.test(url)) {
    fail(`${src} "url" must start with https://x.com/ (got: ${url})`);
  }
  console.log(`POST.json url: ${url}`);

  // 3. Copy it byte for byte into the output dir.
  mkdirSync(outDir, { recursive: true });
  copyFileSync(src, dest);
  console.log(`POST.json copied: ${src} -> ${dest}`);
} catch (err) {
  if (err instanceof SyntaxError) fail(`${src} is not valid JSON`, err);
  if (err instanceof Error && "code" in err && err.code === "ENOENT") {
    fail(`POST.json not found at ${src}`);
  }
  fail(`Failed to ship POST.json from ${src} to ${dest}`, err);
}

// Markdown prompt + playbook loader. Read once and memoized (mirrors the ICP
// tool reading RUBRIC.md at module load). Files are read from the project root
// at runtime — any new file here must be added to outputFileTracingIncludes in
// next.config.ts so it survives bundling.

import { readFileSync } from "fs";
import { join } from "path";
import { PROMPTS_DIR, PLAYBOOK_PATH } from "@/lib/constants";

const cache = new Map<string, string>();

export function loadPrompt(name: string): string {
  const key = `prompt:${name}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const text = readFileSync(join(PROMPTS_DIR, `${name}.md`), "utf-8");
  cache.set(key, text);
  return text;
}

export function loadPlaybook(): string {
  const key = "playbook";
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const text = readFileSync(PLAYBOOK_PATH, "utf-8");
  cache.set(key, text);
  return text;
}

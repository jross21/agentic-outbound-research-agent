import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure the agent's static context (system prompt + playbook + per-prompt
  // markdown) and the offline sample fixtures are bundled into the serverless
  // function output — they are read at runtime via fs.readFileSync(process.cwd()).
  // Without this, those files are tree-shaken out of the deployed function and
  // the reads fail in production (the lesson learned from RUBRIC.md in the ICP tool).
  outputFileTracingIncludes: {
    "/api/research": [
      "./prompts/**/*.md",
      "./playbook/**/*.md",
      "./icp/**/*.md",
      "./data/sample/**/*.json",
    ],
    "/api/mode": ["./icp/**/*.md"],
  },
};

export default nextConfig;

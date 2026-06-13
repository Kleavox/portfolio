import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const required = [
  "APP_ROOT_DOMAIN",
  "WORKER_PREFIX",
  "CONTACT_EMAIL",
  "FROM_EMAIL",
  "CLOUDFLARE_ACCOUNT_ID",
];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const domains = process.argv.includes("--domains=canonical");
const rootDomain = process.env.APP_ROOT_DOMAIN;

const config = {
  name: `${process.env.WORKER_PREFIX}-portfolio`,
  account_id: process.env.CLOUDFLARE_ACCOUNT_ID,
  main: "../worker/src/index.ts",
  compatibility_date: "2026-06-05",
  workers_dev: false,
  vars: {
    CONTACT_EMAIL: process.env.CONTACT_EMAIL,
    FROM_EMAIL: process.env.FROM_EMAIL,
  },
  assets: {
    directory: "../app/dist",
    binding: "ASSETS",
    not_found_handling: "404-page",
    run_worker_first: ["/health", "/api/contact"],
  },
  ratelimits: [
    {
      name: "CONTACT_RATE_LIMIT",
      namespace_id: "3301",
      simple: { limit: 3, period: 60 },
    },
  ],
  observability: { enabled: true },
  ...(domains
    ? { routes: [{ pattern: `port.${rootDomain}`, custom_domain: true }] }
    : {}),
};

const secrets = {};
for (const key of ["RESEND_API_KEY", "TURNSTILE_SECRET_KEY"]) {
  if (process.env[key]) secrets[key] = process.env[key];
}

const outDir = path.join(repoRoot, ".wrangler-deploy");
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "portfolio.json"), JSON.stringify(config, null, 2));
writeFileSync(
  path.join(outDir, "portfolio.secrets.json"),
  JSON.stringify(secrets, null, 2),
);
console.log(`Rendered deploy config for ${config.name}`);

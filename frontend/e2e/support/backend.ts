import { execFileSync } from "node:child_process";
import path from "node:path";

import { expect, type APIRequestContext } from "@playwright/test";

const projectRoot = path.resolve(process.cwd(), "..");
const backendRoot = path.join(projectRoot, "backend");
const python = path.join(projectRoot, ".venv", "Scripts", "python.exe");
const tokenScript = path.join(backendRoot, "scripts", "e2e_verification_token.py");
const apiBase = (process.env.E2E_BACKEND_URL ?? "http://127.0.0.1:8010/api/v1").replace(/\/$/, "");
const qaDatabase =
  process.env.E2E_DATABASE_URL ??
  "sqlite:///C:/Users/SOLUTION/AppData/Local/Temp/opencode/bds-frontend-qa.sqlite3";

export function verificationToken(email: string): string {
  return execFileSync(python, [tokenScript, email], {
    cwd: backendRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      DATABASE_URL: qaDatabase,
      PYTHONPATH: [backendRoot, process.env.PYTHONPATH].filter(Boolean).join(path.delimiter),
    },
  }).trim();
}

async function csrfToken(api: APIRequestContext): Promise<string> {
  await api.get(`${apiBase}/auth/csrf/`);
  const state = await api.storageState();
  const cookie = state.cookies.find((item) => item.name === "csrftoken");
  expect(cookie, "CSRF cookie should be issued").toBeTruthy();
  return cookie?.value ?? "";
}

export interface LearnerCredentials {
  email: string;
  password: string;
  displayName: string;
}

export async function createVerifiedLearner(
  api: APIRequestContext,
): Promise<LearnerCredentials> {
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const credentials = {
    email: `e2e-${unique}@example.com`,
    password: "E2ePassword123!",
    displayName: `E2E Learner ${unique.slice(-4)}`,
  };

  const token = await csrfToken(api);
  const register = await api.post(`${apiBase}/auth/register/`, {
    headers: { "X-CSRFToken": token },
    data: {
      email: credentials.email,
      password: credentials.password,
      display_name: credentials.displayName,
    },
  });
  expect(register.ok(), await register.text()).toBeTruthy();

  const verify = await api.post(`${apiBase}/auth/verify-email/`, {
    headers: { "X-CSRFToken": token },
    data: { token: verificationToken(credentials.email) },
  });
  expect(verify.ok(), await verify.text()).toBeTruthy();

  return credentials;
}

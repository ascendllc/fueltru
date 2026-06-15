/**
 * push-to-github.ts
 *
 * Pushes the full monorepo to the GitHub repo at ascendllc/fuelfool using the
 * Replit GitHub integration (no raw token needed — routes through the connectors proxy).
 *
 * Usage (from the repo root):
 *   npx tsx scripts/src/push-to-github.ts
 *
 * Requirements:
 *   - GitHub integration connected in Replit (connector:ccfg_github_01K4B9XD3VRVD2F99YM91YTCAF)
 *   - Run from within a Replit environment (uses REPLIT_CONNECTORS_HOSTNAME / REPL_IDENTITY)
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
import { ReplitConnectors } from "@replit/connectors-sdk";

const OWNER = "ascendllc";
const REPO = "fuelfool";
const BRANCH = "main";
const WORKSPACE = process.cwd();

const connectors = new ReplitConnectors();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function proxy(
  endpoint: string,
  options: RequestInit & { headers?: Record<string, string> } = {}
): Promise<Response> {
  return connectors.proxy("github", endpoint, options as Parameters<typeof connectors.proxy>[2]);
}

async function proxyJson(endpoint: string, options: RequestInit & { headers?: Record<string, string> } = {}) {
  const resp = await proxy(endpoint, options);
  return resp.json();
}

async function createBlob(content: string, encoding: "base64" | "utf-8" = "base64"): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const data = await proxyJson(`/repos/${OWNER}/${REPO}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content, encoding }),
      headers: { "Content-Type": "application/json" },
    });
    if (data.sha) return data.sha as string;
    if (data.error?.message?.includes("Rate limit")) {
      await sleep(300 + attempt * 200);
      continue;
    }
    throw new Error(`Blob creation failed: ${JSON.stringify(data).slice(0, 200)}`);
  }
  throw new Error("Blob creation failed after retries");
}

async function main() {
  console.log("FuelFool → GitHub push script");
  console.log("Repo: https://github.com/" + OWNER + "/" + REPO);
  console.log("");

  // Ensure repo exists, creating it if needed
  const repoCheck = await proxyJson(`/repos/${OWNER}/${REPO}`);
  if (repoCheck.message === "Not Found") {
    console.log("Creating repo...");
    await proxyJson("/user/repos", {
      method: "POST",
      body: JSON.stringify({
        name: REPO,
        description: "FuelFool — trip fuel cost calculator. Monorepo with React frontend + Express API.",
        private: false,
        auto_init: false,
      }),
      headers: { "Content-Type": "application/json" },
    });
    console.log("Repo created.");
  } else {
    console.log("Repo already exists, pushing update...");
  }

  // Get current HEAD SHA (for parent commit) — may not exist on a brand-new repo
  let parentSha: string | null = null;
  const headRef = await proxyJson(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
  if (headRef.object?.sha) {
    parentSha = headRef.object.sha as string;
    console.log("Current HEAD:", parentSha.slice(0, 8));
  } else {
    // Empty repo — seed it via Contents API so Git API works
    console.log("Empty repo detected, seeding initial commit...");
    const readmeContent = readFileSync(join(WORKSPACE, "README.md"), "utf-8");
    const seed = await proxyJson(`/repos/${OWNER}/${REPO}/contents/README.md`, {
      method: "PUT",
      body: JSON.stringify({
        message: "chore: initialize repository",
        content: Buffer.from(readmeContent).toString("base64"),
      }),
      headers: { "Content-Type": "application/json" },
    });
    parentSha = seed.commit?.sha ?? null;
    console.log("Seed commit:", parentSha?.slice(0, 8));
  }

  // Find tracked files
  const allFiles = execSync("git ls-files", { cwd: WORKSPACE })
    .toString()
    .trim()
    .split("\n")
    .filter(Boolean);
  console.log(`\nTracked files: ${allFiles.length}`);

  // Upload all blobs sequentially with 120ms spacing to stay under 10 req/s proxy limit
  const treeItems: { path: string; mode: string; type: string; sha: string }[] = [];
  let skipped = 0;

  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    try {
      const content = readFileSync(join(WORKSPACE, file));
      const sha = await createBlob(content.toString("base64"), "base64");
      treeItems.push({ path: file, mode: "100644", type: "blob", sha });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  skip ${file}: ${msg.slice(0, 80)}`);
      skipped++;
    }
    await sleep(120);
    if ((i + 1) % 25 === 0 || i === allFiles.length - 1) {
      process.stdout.write(`  ${i + 1}/${allFiles.length} blobs created\n`);
    }
  }

  // Create tree
  console.log(`\nCreating tree (${treeItems.length} items, ${skipped} skipped)...`);
  const treeData = await proxyJson(`/repos/${OWNER}/${REPO}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ tree: treeItems }),
    headers: { "Content-Type": "application/json" },
  });
  if (!treeData.sha) {
    console.error("Tree creation failed:", JSON.stringify(treeData).slice(0, 400));
    process.exit(1);
  }

  // Create commit
  const commitMsg = execSync("git log -1 --pretty=%B", { cwd: WORKSPACE }).toString().trim();
  console.log("Creating commit...");
  const commitData = await proxyJson(`/repos/${OWNER}/${REPO}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: commitMsg,
      tree: treeData.sha,
      parents: parentSha ? [parentSha] : [],
    }),
    headers: { "Content-Type": "application/json" },
  });
  if (!commitData.sha) {
    console.error("Commit creation failed:", JSON.stringify(commitData).slice(0, 400));
    process.exit(1);
  }
  console.log("Commit:", commitData.sha.slice(0, 8));

  // Update branch ref
  const refUpdate = await proxyJson(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commitData.sha, force: true }),
    headers: { "Content-Type": "application/json" },
  });

  if (refUpdate.ref) {
    console.log("\n✓ Push complete!");
    console.log("  Repo: https://github.com/" + OWNER + "/" + REPO);
    console.log("\nNext steps:");
    console.log("  1. Deploy API → https://railway.app  (see README Step 1)");
    console.log("  2. Deploy frontend → https://vercel.com  (see README Step 2)");
  } else {
    console.error("Ref update failed:", JSON.stringify(refUpdate).slice(0, 400));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});

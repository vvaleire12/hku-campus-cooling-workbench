import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Native Git publication: no PAT files, separate checkout or force-push needed.
execFileSync("npm", ["run", "build:html"], { stdio: "inherit" });
const git = (args, options = {}) =>
  execFileSync("git", args, { encoding: "utf8", ...options }).trim();
const branch = "refs/heads/gh-pages";
const remoteLine = git(["ls-remote", "origin", branch]);
let parent = remoteLine.split(/\s+/)[0];
if (parent) {
  git(["fetch", "--no-tags", "origin", branch]);
  parent = git(["rev-parse", "FETCH_HEAD"]);
  try {
    git(["show", `${parent}:.campus-cooling-pages`], {
      stdio: ["pipe", "pipe", "ignore"],
    });
  } catch {
    throw new Error(
      "The existing gh-pages branch is not marked as this prototype deployment. It has been left unchanged.",
    );
  }
}
const directory = mkdtempSync(join(tmpdir(), "cooling-pages-"));
const env = { ...process.env, GIT_INDEX_FILE: join(directory, "index") };
const indexed = (args) => git(args, { env });
const textBlob = (text) =>
  git(["hash-object", "-w", "--stdin"], { input: text });
try {
  indexed(["read-tree", "--empty"]);
  const entries = {
    "index.html": git(["hash-object", "-w", "dist-html/index.html"]),
    ".nojekyll": textBlob(""),
    ".campus-cooling-pages": textBlob(
      "Static deployment of vvaleire12/hku-campus-cooling-workbench\n",
    ),
    "README.md": textBlob(
      "# Campus cooling Workbench\n\nThis branch contains the standalone HTML website.\n\nSource: https://github.com/vvaleire12/hku-campus-cooling-workbench\n\nGitHub Pages source: gh-pages / (root).\n",
    ),
  };
  if (parent) {
    try {
      entries.CNAME = git(["rev-parse", `${parent}:CNAME`], {
        stdio: ["pipe", "pipe", "ignore"],
      });
    } catch {
      /* No custom domain configured. */
    }
  }
  for (const [path, blob] of Object.entries(entries))
    indexed(["update-index", "--add", "--cacheinfo", `100644,${blob},${path}`]);
  const tree = indexed(["write-tree"]);
  const args = [
    "commit-tree",
    tree,
    ...(parent ? ["-p", parent] : []),
    "-m",
    "Publish standalone Campus cooling Workbench",
  ];
  const commit = git(args);
  execFileSync("git", ["push", "origin", `${commit}:${branch}`], {
    stdio: "inherit",
  });
  console.log(`Published static branch: ${commit}`);
  console.log(
    "Pages must use gh-pages / (root). Pushing a branch alone does not confirm that Pages is enabled.",
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}

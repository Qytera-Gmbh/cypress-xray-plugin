import { execSync } from "node:child_process";
import { copyFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const DIST_DIR = join(__dirname, "dist");

if (existsSync(DIST_DIR)) {
    rmSync(DIST_DIR, { recursive: true });
}
execSync("tsc --project tsconfig-build.json", { stdio: "inherit" });
copyFileSync("README.md", join(DIST_DIR, "README.md"));
copyFileSync("package.json", join(DIST_DIR, "package.json"));
copyFileSync("package-lock.json", join(DIST_DIR, "package-lock.json"));

// Remove devDependencies from built package (users do not need them).
execSync("npm pkg delete devDependencies", { cwd: DIST_DIR, stdio: "inherit" });
execSync("npm install --omit=dev --package-lock-only --no-fund --no-audit", {
    cwd: DIST_DIR,
    stdio: "inherit",
});

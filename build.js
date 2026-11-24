const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("==> Starting frontend build from root...");

const projectDir = path.join(__dirname, "kayalexpences");

// 1. Set environment variables
const env = {
  ...process.env,
  VITE_API_URL: process.env.VITE_API_URL || "https://kayal-expenses-api.onrender.com/api",
};

// 2. Helper to run commands
function run(cmd, cwd = process.cwd()) {
  console.log(`==> Running: ${cmd}`);
  execSync(cmd, { cwd, env, stdio: "inherit" });
}

// 3. Ensure pnpm is available
try {
  execSync("pnpm --version", { stdio: "ignore" });
  console.log("==> pnpm is already available.");
} catch {
  console.log("==> Setting up pnpm via corepack / npm...");
  try {
    run("corepack enable");
  } catch (err) {
    console.log("==> corepack enable failed, installing pnpm via npm...");
    run("npm install -g pnpm");
  }
}

// 4. Install dependencies in kayalexpences
console.log("==> Installing dependencies in kayalexpences...");
try {
  run("pnpm install --no-frozen-lockfile", projectDir);
} catch (err) {
  console.log("==> Retrying with npx pnpm install...");
  run("npx --yes pnpm install --no-frozen-lockfile", projectDir);
}

// 5. Build frontend
console.log("==> Building frontend with Vite...");
try {
  run("pnpm run build", projectDir);
} catch (err) {
  console.log("==> Retrying with npx pnpm run build...");
  run("npx --yes pnpm run build", projectDir);
}

// 6. Copy build output to root 'dist' so Render's default Publish Directory (dist) works
const sourceDir = path.join(projectDir, "dist", "public");
const targetDir = path.join(__dirname, "dist");

console.log(`==> Copying build output from ${sourceDir} to ${targetDir}...`);
if (fs.existsSync(sourceDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });
  console.log("==> Successfully copied dist files to root dist/!");
} else {
  console.error("==> Error: Build output directory not found at " + sourceDir);
  process.exit(1);
}

console.log("==> Build finished successfully! Ready for Render deployment.");

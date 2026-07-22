import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const command = process.argv[2] ?? "dev";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const executable = path.join(root, "node_modules", "vinext", "dist", "cli.js");
const child = spawn(process.execPath, [executable, command], {
  cwd: root,
  env: { ...process.env, WRANGLER_LOG_PATH: ".wrangler/wrangler.log" },
  stdio: "inherit",
  shell: false,
});
child.on("exit", (code) => process.exit(code ?? 1));

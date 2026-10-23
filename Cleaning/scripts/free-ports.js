// Frees the ports this project uses (frontend :5173, backend :5000) before
// starting the dev/start servers. This fixes the "opens the first time,
// then gives a port-in-use error after closing the terminal" problem:
// closing a terminal window doesn't always stop the Node process behind it,
// so the port stays occupied the next time you run the project.
//
// Uses only built-in OS commands (no extra npm install needed):
//   Windows -> netstat + taskkill
//   macOS/Linux -> lsof + kill

const { execSync } = require("child_process");

const PORTS = [5173, 5000];

function freePort(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr :${port}`, {
        stdio: ["ignore", "pipe", "ignore"],
      }).toString();

      const pids = new Set();
      out
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line) => {
          const parts = line.split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== "0") pids.add(pid);
        });

      pids.forEach((pid) => {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
          console.log(`[free-ports] Port ${port}: stopped leftover process ${pid}`);
        } catch (_) {
          // Process may already be gone — fine.
        }
      });
    } else {
      const out = execSync(`lsof -ti tcp:${port}`, {
        stdio: ["ignore", "pipe", "ignore"],
      })
        .toString()
        .trim();

      if (out) {
        out.split("\n").forEach((pid) => {
          try {
            execSync(`kill -9 ${pid}`, { stdio: "ignore" });
            console.log(`[free-ports] Port ${port}: stopped leftover process ${pid}`);
          } catch (_) {
            // Process may already be gone — fine.
          }
        });
      }
    }
  } catch (_) {
    // Nothing was listening on this port — nothing to do, not an error.
  }
}

PORTS.forEach(freePort);

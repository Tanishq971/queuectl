import { spawn } from "child_process";

export default function worker(action: string) {
  if (action === "start") {
    const w = spawn("node", ["dist/workers/worker-process.js"], {
      stdio: "inherit",
    });

    console.log(`Worker started | PID: ${w.pid}`);
  }
}

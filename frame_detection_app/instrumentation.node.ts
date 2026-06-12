export async function register() {
  // dynamic imports so the edge bundler never sees node-only modules
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { spawnSync, spawn } = await import("child_process");
  const path = await import("path");

  const backendDir = path.resolve(process.cwd(), "backend");

  console.log("[backend] installing requirements...");
  const install = spawnSync("python3", ["-m", "pip", "install", "-r", "requirements.txt"], {
    cwd: backendDir,
    stdio: "inherit",
  });

  if (install.status !== 0) {
    console.error("[backend] pip install failed — python server will not start");
    return;
  }
  console.log("[backend] requirements ok");

  console.log("[backend] starting server...");
  const server = spawn("python3", ["server.py"], {
    cwd: backendDir,
    stdio: "pipe",
  });

  server.stdout?.on("data", (chunk: Buffer) => {
    chunk.toString().split("\n").filter(Boolean).forEach(line =>
      console.log("[backend]", line)
    );
  });

  server.stderr?.on("data", (chunk: Buffer) => {
    chunk.toString().split("\n").filter(Boolean).forEach(line =>
      console.error("[backend]", line)
    );
  });

  server.on("error", (err) => {
    console.error("[backend] failed to launch server:", err.message);
  });

  server.on("close", (code) => {
    console.log(`[backend] server exited (code ${code})`);
  });

  // kill the python process when next.js exits so it doesn't linger
  const kill = () => { try { server.kill(); } catch { /* already gone */ } };
  process.on("exit", kill);
  process.on("SIGTERM", kill);
  process.on("SIGINT", kill);

  console.log(`[backend] server started (pid ${server.pid})`);
}

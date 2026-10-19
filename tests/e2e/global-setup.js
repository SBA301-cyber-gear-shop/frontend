import { createServer } from "vite";
import { fileURLToPath } from "node:url";

// Own the Vite server in-process: shutdown does not depend on Windows
// taskkill /T traversing a shell -> npm -> node process tree.
export default async function globalSetup() {
  const servers = [];
  try {
    for (const [port, demo] of [
      [4175, true],
      [4176, false],
    ]) {
      const server = await createServer({
        root: fileURLToPath(new URL("../../", import.meta.url)),
        cacheDir: `node_modules/.vite-e2e-${port}`,
        define: {
          "import.meta.env.VITE_USE_DEMO_DATA": JSON.stringify(String(demo)),
        },
        server: { host: "127.0.0.1", port, strictPort: true },
      });
      servers.push(server);
      await server.listen();
    }
  } catch (error) {
    await Promise.all(servers.map((server) => server.close()));
    throw error;
  }
  return () => Promise.all(servers.map((server) => server.close()));
}

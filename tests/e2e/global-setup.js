import { createServer } from "vite";
import { fileURLToPath } from "node:url";

// Own the Vite server in-process: shutdown does not depend on Windows
// taskkill /T traversing a shell -> npm -> node process tree.
export default async function globalSetup() {
  const server = await createServer({
    root: fileURLToPath(new URL("../../", import.meta.url)),
    server: { host: "127.0.0.1", port: 4175, strictPort: true },
  });
  try {
    await server.listen();
  } catch (error) {
    await server.close();
    throw error;
  }
  return () => server.close();
}

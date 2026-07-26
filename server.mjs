import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(".");
const port = Number(process.env.PORT || 3001);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(root, normalized === "/" ? "index.html" : normalized);
  return filePath.startsWith(root) ? filePath : join(root, "index.html");
}

const server = createServer((request, response) => {
  let filePath = safePath(request.url || "/");

  if (!existsSync(filePath)) {
    filePath = join(root, "index.html");
  }

  if (statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  }

  const type = types[extname(filePath)] || "application/octet-stream";
  response.writeHead(200, { "content-type": type });
  createReadStream(filePath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`yt-dlp Command Builder locale: http://localhost:${port}/`);
});

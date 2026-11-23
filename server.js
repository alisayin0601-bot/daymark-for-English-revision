const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const ROOT = __dirname;
const { loadEnv } = require("./server/util");
loadEnv(ROOT);

const { initDb } = require("./server/db");
initDb();

const { sessionUser, cleanupSessions } = require("./server/session");
const { handleApi } = require("./server/api");

const PORT = Number(process.env.PORT) || 4173;
const HOST = process.env.HOST || "127.0.0.1";
// Public deployments (a VPS, a tunnel, a container) usually need to listen on
// every interface. Set HOST=0.0.0.0 in .env when the site must be reachable
// from outside the machine. Allowing the platform to inject a host variable is
// the only reason this is not hard-coded.
const PUBLIC_DIR = path.join(ROOT, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json"
};

const COMPRESSIBLE = new Set([".html", ".css", ".js", ".json", ".svg", ".txt", ".webmanifest"]);
const gzipCache = new Map();

function securityHeaders(contentType) {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "microphone=(self), camera=(), geolocation=()",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
    ...(contentType ? { "Content-Type": contentType } : {})
  };
}

function serveFile(req, res, filePath, { status = 200, spa = false } = {}) {
  let stat;
  try {
    stat = fs.statSync(filePath);
    if (!stat.isFile()) throw new Error("not a file");
  } catch {
    res.writeHead(404, securityHeaders("text/plain; charset=utf-8"));
    res.end("Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const etag = `W/"${stat.size}-${Number(stat.mtimeMs).toString(36)}"`;
  if (req.headers["if-none-match"] === etag) {
    res.writeHead(304, { ETag: etag, "Cache-Control": "no-cache" });
    res.end();
    return;
  }

  const headers = {
    ...securityHeaders(MIME[ext] || "application/octet-stream"),
    ETag: etag,
    "Cache-Control": spa ? "no-cache" : ext === ".html" ? "no-cache" : "public, max-age=3600",
    "Content-Length": stat.size
  };

  const acceptsGzip = String(req.headers["accept-encoding"] || "").includes("gzip");
  if (acceptsGzip && COMPRESSIBLE.has(ext) && stat.size > 1024) {
    let cached = gzipCache.get(filePath);
    if (!cached || cached.mtime !== stat.mtimeMs) {
      cached = { mtime: stat.mtimeMs, body: zlib.gzipSync(fs.readFileSync(filePath)) };
      gzipCache.set(filePath, cached);
    }
    headers["Content-Encoding"] = "gzip";
    headers["Content-Length"] = cached.body.length;
    headers.Vary = "Accept-Encoding";
    res.writeHead(status, headers);
    if (req.method === "HEAD") res.end();
    else res.end(cached.body);
    return;
  }

  res.writeHead(status, headers);
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  fs.createReadStream(filePath).pipe(res);
}

function resolvePublicPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const candidate = path.join(PUBLIC_DIR, normalized);
  if (!candidate.startsWith(PUBLIC_DIR)) return null;
  return candidate;
}

const server = http.createServer(async (req, res) => {
  const urlPath = req.url || "/";

  if (urlPath.startsWith("/api/")) {
    try {
      const user = sessionUser(req);
      const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
      const handled = await handleApi(req, res, url, user);
      if (handled !== false) return;
    } catch (error) {
      console.error("[api] unhandled:", error);
      if (!res.writableEnded) {
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: "Something went wrong on the server." }));
      }
      return;
    }
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, securityHeaders("text/plain; charset=utf-8"));
    res.end("Method not allowed");
    return;
  }

  const target = resolvePublicPath(urlPath);
  if (target && fs.existsSync(target) && fs.statSync(target).isFile()) {
    serveFile(req, res, target);
    return;
  }

  // Single-page app: every unknown route serves the shell.
  serveFile(req, res, path.join(PUBLIC_DIR, "index.html"), { spa: true });
});

server.on("clientError", (error, socket) => {
  if (socket.writable) socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

server.listen(PORT, HOST, () => {
  console.log("");
  console.log("  Daymark IELTS");
  console.log(`  → http://${HOST}:${PORT}`);
  const aiProvider = (process.env.AI_PROVIDER || (process.env.OPENROUTER_API_KEY ? "openrouter" : process.env.QWEN_API_KEY ? "qwen" : process.env.DEEPSEEK_API_KEY ? "deepseek" : "qwen")).toLowerCase();
  const aiKey = aiProvider === "gemini" ? process.env.GEMINI_API_KEY : aiProvider === "openai" ? process.env.OPENAI_API_KEY : aiProvider === "qwen" ? process.env.QWEN_API_KEY : aiProvider === "openrouter" ? process.env.OPENROUTER_API_KEY : process.env.DEEPSEEK_API_KEY;
  const aiModel = aiProvider === "gemini" ? process.env.GEMINI_MODEL : aiProvider === "openai" ? process.env.OPENAI_MODEL : aiProvider === "qwen" ? process.env.QWEN_MODEL : aiProvider === "openrouter" ? process.env.OPENROUTER_MODEL : process.env.DEEPSEEK_MODEL;
  console.log(`  AI: ${aiKey ? `${aiProvider} (${aiModel || "default model"})` : `Off (add ${aiProvider === "gemini" ? "GEMINI_API_KEY" : aiProvider === "openai" ? "OPENAI_API_KEY" : aiProvider === "qwen" ? "QWEN_API_KEY" : aiProvider === "openrouter" ? "OPENROUTER_API_KEY" : "DEEPSEEK_API_KEY"} to .env)`}`);
  console.log("");
});

function shutdown(signal) {
  console.log(`\n[server] ${signal}; closing.`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => shutdown(signal));
}

const cleanupTimer = setInterval(() => {
  try {
    cleanupSessions();
    if (typeof global.gc === "function") global.gc();
  } catch (error) {
    console.error("[cleanup]", error?.message || error);
  }
}, 60 * 60 * 1000);
cleanupTimer.unref();

module.exports = server;

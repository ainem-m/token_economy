import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { authenticate, requireParentPin } from "./auth.mjs";
import { addTransaction, cancelTransaction, initDb, readAppState, resetAppStateForTest, updateGoals, updateSettings } from "./db.mjs";

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const DIST_DIR = path.join(process.cwd(), "dist");

initDb();

createServer(async (request, response) => {
  try {
    if (request.url?.startsWith("/api/")) {
      await handleApi(request, response);
      return;
    }

    await serveStatic(request, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: "internal_error" });
  }
}).listen(PORT, HOST, () => {
  console.log(`token-eco server listening on http://${HOST}:${PORT}`);
});

async function handleApi(request, response) {
  const account = await authenticate(request);
  if (!account) {
    sendJson(response, 401, { error: "unauthorized" });
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "GET" && url.pathname === "/api/kiosk-state") {
    sendJson(response, 200, { state: readAppState(), account });
    return;
  }

  if (url.pathname.startsWith("/api/parent") || isWriteRequest(request, url)) {
    if (!requireParentPin(request)) {
      sendJson(response, 403, { error: "parent_pin_required" });
      return;
    }
  }

  if (request.method === "GET" && url.pathname === "/api/parent-state") {
    sendJson(response, 200, { state: readAppState(), account });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/transactions") {
    try {
      addTransaction(await readJson(request));
    } catch (error) {
      if (sendKnownError(response, error)) return;
      throw error;
    }
    sendJson(response, 201, { state: readAppState(), account });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/settings") {
    updateSettings(await readJson(request));
    sendJson(response, 200, { state: readAppState(), account });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/test/reset") {
    try {
      resetAppStateForTest();
    } catch (error) {
      if (sendKnownError(response, error)) return;
      throw error;
    }
    sendJson(response, 200, { state: readAppState(), account });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/goals") {
    try {
      updateGoals(await readJson(request));
    } catch (error) {
      if (sendKnownError(response, error)) return;
      throw error;
    }
    sendJson(response, 200, { state: readAppState(), account });
    return;
  }

  const cancelMatch = url.pathname.match(/^\/api\/transactions\/([^/]+)\/cancel$/);
  if (request.method === "POST" && cancelMatch) {
    const body = await readJson(request);
    try {
      cancelTransaction(cancelMatch[1], String(body.reason || "取り消し"));
    } catch (error) {
      if (sendKnownError(response, error)) return;
      throw error;
    }
    sendJson(response, 201, { state: readAppState(), account });
    return;
  }

  sendJson(response, 404, { error: "not_found" });
}

function isWriteRequest(request, url) {
  return request.method !== "GET" && url.pathname.startsWith("/api/");
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendKnownError(response, error) {
  if (!error?.status || !error?.code) return false;
  sendJson(response, error.status, { error: error.code });
  return true;
}

async function serveStatic(request, response) {
  const url = new URL(request.url || "/", "http://localhost");
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const candidate = path.normalize(path.join(DIST_DIR, pathname));
  const filePath = candidate.startsWith(DIST_DIR) && existsSync(candidate) ? candidate : path.join(DIST_DIR, "index.html");

  if (!existsSync(filePath)) {
    response.writeHead(404);
    response.end("Run npm run build before starting the server.");
    return;
  }

  response.writeHead(200, { "content-type": contentType(filePath) });
  createReadStream(filePath).pipe(response);
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".webmanifest")) return "application/manifest+json";
  return "application/octet-stream";
}

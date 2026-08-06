/* eslint-disable @typescript-eslint/no-require-imports */
const http = require("node:http");
const { handler } = require("./index");

const port = Number(process.env.API_PORT) || 3011;

const server = http.createServer((request, response) => {
  const requestPath = request.url?.split("?")[0] || "";
  if (!["/api/chat", "/api/health"].includes(requestPath)) {
    response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    return response.end(JSON.stringify({ error: "Not found" }));
  }

  let body = "";
  let bodyTooLarge = false;
  request.setEncoding("utf8");
  request.on("data", (chunk) => {
    if (bodyTooLarge) return;
    body += chunk;
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) {
      bodyTooLarge = true;
      body = "";
    }
  });
  request.on("end", async () => {
    if (bodyTooLarge) {
      response.writeHead(413, { "Content-Type": "application/json; charset=utf-8" });
      return response.end(JSON.stringify({ error: "Request body is too large" }));
    }
    const result = await handler({
      httpMethod: request.method,
      path: requestPath,
      headers: request.headers,
      body,
      isBase64Encoded: false,
    });
    response.writeHead(result.statusCode, result.headers);
    response.end(result.body);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Alfa Delo API: http://127.0.0.1:${port}/api/chat · /api/health`);
});

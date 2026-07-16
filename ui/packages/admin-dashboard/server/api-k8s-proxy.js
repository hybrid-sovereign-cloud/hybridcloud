/**
 * Transparent Kubernetes API proxy for standalone dashboards.
 * Mount with: app.use('/api/k8s', requireAuth, createApiK8sProxy(apiServer))
 */
import https from "https";
import fs from "fs";

const SA_CA_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt";

function getCACert() {
  try {
    return fs.readFileSync(SA_CA_PATH);
  } catch {
    return undefined;
  }
}

function userToken(req) {
  const h = req.headers["x-forwarded-access-token"];
  if (typeof h === "string" && h.trim()) return h.trim();
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return null;
}

/**
 * @param {string} apiServer e.g. https://kubernetes.default.svc
 * @returns {import('express').RequestHandler}
 */
export function createApiK8sProxy(apiServer) {
  return (req, res) => {
    const token = userToken(req);
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // When mounted at /api/k8s, req.url is the remainder (e.g. /apis/...)
    const k8sPath = (req.url || "/").startsWith("/") ? req.url : `/${req.url}`;
    if (!k8sPath.startsWith("/api/") && !k8sPath.startsWith("/apis/")) {
      return res.status(400).json({ message: "Only /api and /apis paths are allowed" });
    }

    let url;
    try {
      url = new URL(k8sPath, apiServer);
    } catch {
      return res.status(400).json({ message: "Invalid path" });
    }

    const ca = getCACert();
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: req.headers.accept || "application/json",
    };
    if (req.headers["content-type"]) {
      headers["Content-Type"] = req.headers["content-type"];
    }

    const opts = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: req.method,
      headers,
      rejectUnauthorized: !!ca,
      ca,
      timeout: 30000,
    };

    const upstream = https.request(opts, (incoming) => {
      res.status(incoming.statusCode || 502);
      const ct = incoming.headers["content-type"];
      if (ct) res.setHeader("Content-Type", ct);
      incoming.pipe(res);
    });
    upstream.on("timeout", () => {
      upstream.destroy();
      if (!res.headersSent) res.status(504).json({ message: "Upstream timeout" });
    });
    upstream.on("error", (err) => {
      console.error("api/k8s proxy error:", err.message);
      if (!res.headersSent) res.status(502).json({ message: "Bad gateway" });
    });

    if (req.method !== "GET" && req.method !== "HEAD" && req.body && Object.keys(req.body).length) {
      upstream.write(typeof req.body === "string" ? req.body : JSON.stringify(req.body));
    }
    upstream.end();
  };
}

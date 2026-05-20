import { createPublicKey, webcrypto } from "node:crypto";
import { findAccount } from "./db.mjs";

const DEV_AUTH = process.env.TOKEN_ECO_AUTH_MODE !== "cloudflare";
const TEAM_DOMAIN = process.env.CLOUDFLARE_TEAM_DOMAIN;
const POLICY_AUD = process.env.CLOUDFLARE_POLICY_AUD;

let jwksCache = null;

export async function authenticate(request) {
  if (DEV_AUTH) {
    const role = request.headers["x-token-eco-role"] === "child" ? "child" : "parent";
    const email = String(request.headers["x-token-eco-email"] || `${role}@local.dev`).toLowerCase();
    return { email, role };
  }

  const token = request.headers["cf-access-jwt-assertion"];
  if (!token || typeof token !== "string") return null;

  const claims = await verifyAccessJwt(token);
  const email = String(claims.email || "").toLowerCase();
  return findAccount(email);
}

export function requireParent(account) {
  return account?.role === "parent";
}

async function verifyAccessJwt(token) {
  if (!TEAM_DOMAIN || !POLICY_AUD) {
    throw new Error("CLOUDFLARE_TEAM_DOMAIN and CLOUDFLARE_POLICY_AUD are required in cloudflare auth mode");
  }

  const [headerRaw, payloadRaw, signatureRaw] = token.split(".");
  if (!headerRaw || !payloadRaw || !signatureRaw) throw new Error("Malformed Access JWT");

  const header = JSON.parse(base64UrlDecode(headerRaw).toString("utf8"));
  const claims = JSON.parse(base64UrlDecode(payloadRaw).toString("utf8"));
  const key = await getSigningKey(header.kid);

  const ok = await webcrypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    base64UrlDecode(signatureRaw),
    Buffer.from(`${headerRaw}.${payloadRaw}`),
  );
  if (!ok) throw new Error("Invalid Access JWT signature");

  const issuer = TEAM_DOMAIN.replace(/\/$/, "");
  if (claims.iss !== issuer) throw new Error("Invalid Access JWT issuer");

  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audiences.includes(POLICY_AUD)) throw new Error("Invalid Access JWT audience");

  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp === "number" && claims.exp <= now) throw new Error("Expired Access JWT");

  return claims;
}

async function getSigningKey(kid) {
  const jwks = await getJwks();
  const jwk = jwks.keys.find((candidate) => candidate.kid === kid);
  if (!jwk) throw new Error("Unknown Access JWT signing key");

  const publicKey = createPublicKey({ key: jwk, format: "jwk" });
  return webcrypto.subtle.importKey(
    "spki",
    publicKey.export({ type: "spki", format: "der" }),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
}

async function getJwks() {
  if (jwksCache) return jwksCache;
  const response = await fetch(`${TEAM_DOMAIN.replace(/\/$/, "")}/cdn-cgi/access/certs`);
  if (!response.ok) throw new Error("Failed to fetch Cloudflare Access certs");
  jwksCache = await response.json();
  return jwksCache;
}

function base64UrlDecode(value) {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

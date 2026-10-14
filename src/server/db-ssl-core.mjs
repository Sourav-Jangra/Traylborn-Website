// TLS settings for MySQL connections, shared by src/server/env.ts and scripts/lib/db.mjs so
// the app and the scripts connect the same way. Plain JS so node can import it directly.
// Error messages name variables only, never their values.
import { isIP } from "node:net";

const CERTIFICATE = /-----BEGIN CERTIFICATE-----[A-Za-z0-9+/=\s]+?-----END CERTIFICATE-----/g;

/**
 * @typedef {{ rejectUnauthorized: true, verifyIdentity: true, ca?: string }} DatabaseSsl
 */

/**
 * mysql2 `ssl` options from DATABASE_SSL and DATABASE_SSL_CA, or undefined when TLS is off.
 * When on, the server certificate chain and the hostname it was issued for are both verified.
 * @param {Record<string, string | undefined>} env
 * @returns {DatabaseSsl | undefined}
 */
export function databaseSsl(env) {
  const flag = (env.DATABASE_SSL ?? "").trim().toLowerCase();
  if (flag !== "" && flag !== "true" && flag !== "false") throw new Error('DATABASE_SSL must be "true" or "false".');
  const caValue = (env.DATABASE_SSL_CA ?? "").trim();

  if (flag !== "true") {
    if (caValue) throw new Error('DATABASE_SSL_CA is set but DATABASE_SSL is not "true".');
    return undefined;
  }
  // mysql2 skips the hostname check for IP addresses.
  if (isIP(env.DATABASE_HOST ?? "")) {
    throw new Error("DATABASE_HOST must be a hostname, not an IP address, when DATABASE_SSL is true.");
  }

  /** @type {DatabaseSsl} */
  const ssl = { rejectUnauthorized: true, verifyIdentity: true };
  if (!caValue) return ssl;

  // Single-line values (hPanel, CI secrets) carry line breaks as a literal "\n".
  const ca = caValue.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
  const certificates = ca.match(CERTIFICATE);
  if (!certificates || ca.replace(CERTIFICATE, "").trim()) {
    throw new Error("DATABASE_SSL_CA must contain only PEM certificates (-----BEGIN CERTIFICATE----- … -----END CERTIFICATE-----).");
  }
  ssl.ca = certificates.join("\n") + "\n";
  return ssl;
}

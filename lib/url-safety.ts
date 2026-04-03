import dns from "dns/promises";

const BLOCKED_HOSTNAMES = new Set(["localhost", "metadata.google.internal"]);

function isBlockedIpv4(ip: string): boolean {
  const octets = ip.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b] = octets;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function normalizeIpv6(ip: string): string {
  const zoneIndex = ip.indexOf("%");
  return (zoneIndex >= 0 ? ip.slice(0, zoneIndex) : ip).toLowerCase();
}

function isBlockedIpv6(ip: string): boolean {
  const normalized = normalizeIpv6(ip);

  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:") ||
    normalized === "::ffff:127.0.0.1" ||
    normalized === "::ffff:169.254.169.254"
  );
}

function isIpLiteral(hostname: string): boolean {
  return /^\d+\.\d+\.\d+\.\d+$/.test(hostname) || hostname.includes(":");
}

function isBlockedIp(ip: string): boolean {
  return ip.includes(":") ? isBlockedIpv6(ip) : isBlockedIpv4(ip);
}

/**
 * Check if a URL targets a private/internal IP address.
 * Fails closed on invalid URLs and DNS lookup failures.
 */
export async function isPrivateUrl(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return true;
    if (BLOCKED_HOSTNAMES.has(hostname)) return true;

    if (isIpLiteral(hostname)) {
      return isBlockedIp(hostname);
    }

    const addresses = await dns.lookup(hostname, { all: true, verbatim: true });
    if (addresses.length === 0) return true;

    return addresses.some(({ address }) => isBlockedIp(address));
  } catch {
    return true;
  }
}

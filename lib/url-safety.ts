import dns from "dns/promises";

const BLOCKED_HOSTNAMES = new Set(["localhost", "metadata.google.internal"]);

function isBlockedIpv4(ip: string): boolean {
  const octets = ip.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b, c] = octets;

  return (
    a === 0 ||                                         // 0.0.0.0/8
    a === 10 ||                                        // 10.0.0.0/8 (private)
    a === 127 ||                                       // 127.0.0.0/8 (loopback)
    (a === 100 && b >= 64 && b <= 127) ||              // 100.64.0.0/10 (shared address)
    (a === 169 && b === 254) ||                        // 169.254.0.0/16 (link-local / cloud metadata)
    (a === 172 && b >= 16 && b <= 31) ||               // 172.16.0.0/12 (private)
    (a === 192 && b === 0 && c === 2) ||               // 192.0.2.0/24 (TEST-NET-1)
    (a === 192 && b === 168) ||                        // 192.168.0.0/16 (private)
    (a === 198 && b >= 18 && b <= 19) ||               // 198.18.0.0/15 (benchmarking)
    (a === 198 && b === 51 && c === 100) ||             // 198.51.100.0/24 (TEST-NET-2)
    (a === 203 && b === 0 && c === 113) ||              // 203.0.113.0/24 (TEST-NET-3)
    a >= 240                                           // 240.0.0.0/4 (reserved) + 255.255.255.255
  );
}

function normalizeIpv6(ip: string): string {
  const zoneIndex = ip.indexOf("%");
  return (zoneIndex >= 0 ? ip.slice(0, zoneIndex) : ip).toLowerCase();
}

/** Decode an IPv4-mapped IPv6 address and check if the embedded IPv4 is private.
 *  Handles both decimal (::ffff:127.0.0.1) and hex-group (::ffff:7f00:1) notation.
 */
function isBlockedIpv4Mapped(normalized: string): boolean {
  if (!normalized.startsWith("::ffff:")) return false;
  const suffix = normalized.slice(7); // everything after "::ffff:"

  // Decimal dotted notation: ::ffff:a.b.c.d
  if (/^\d+\.\d+\.\d+\.\d+$/.test(suffix)) {
    return isBlockedIpv4(suffix);
  }

  // Hex-group notation: ::ffff:XXXX:YYYY  (e.g. ::ffff:7f00:1 = 127.0.0.1)
  const hexMatch = suffix.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hexMatch) {
    const hi = parseInt(hexMatch[1], 16);
    const lo = parseInt(hexMatch[2], 16);
    const ip = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
    return isBlockedIpv4(ip);
  }

  // Unknown ::ffff: format — block it to be safe
  return true;
}

function isBlockedIpv6(ip: string): boolean {
  const normalized = normalizeIpv6(ip);

  return (
    normalized === "::1" ||           // loopback
    normalized === "::" ||            // unspecified
    normalized.startsWith("fc") ||   // fc00::/7 (unique local)
    normalized.startsWith("fd") ||   // fd00::/8 (unique local)
    normalized.startsWith("fe80:") || // fe80::/10 (link-local)
    isBlockedIpv4Mapped(normalized)   // ::ffff:x.x.x.x (IPv4-mapped, decimal or hex)
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
 *
 * NOTE: This check resolves the hostname once before the fetch call, which means
 * a DNS rebinding attack (resolving to a public IP then switching to a private IP
 * before the TCP connection) is theoretically possible. Full mitigation would
 * require a network-level egress firewall. For the MVP threat model this is an
 * acceptable residual risk.
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

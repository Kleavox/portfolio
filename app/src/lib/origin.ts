export function getPublicOrigin(
  rootOrigin: string,
  subdomain?: string,
): string {
  const url = new URL(rootOrigin);
  if (!subdomain) return url.origin;

  if (url.hostname === "localhost") {
    const ports: Record<string, string> = {
      pass: "3001",
      link: "3002",
      pulse: "3003",
      port: "3004",
    };
    return `http://localhost:${ports[subdomain] || url.port}`;
  }

  return `https://${subdomain}.${url.host}`;
}

import { isIP } from 'node:net';

/**
 * Validate a client-supplied Phoenix collector URL before the server connects to it.
 *
 * Locally (`vercel dev`, scripts) any http(s) URL is fine so a Phoenix container on
 * localhost works. On deployed Vercel the endpoint must be https on a DNS name —
 * no localhost or IP literals — so callers can't point the server at internal hosts.
 */
export function isAllowedPhoenixEndpoint(endpoint: string, vercelEnv = process.env.VERCEL_ENV): boolean {
    let url: URL;
    try {
        url = new URL(endpoint);
    } catch {
        return false;
    }

    const deployed = vercelEnv === 'production' || vercelEnv === 'preview';
    if (!deployed) return url.protocol === 'http:' || url.protocol === 'https:';

    const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    return url.protocol === 'https:'
        && isIP(host) === 0
        && host !== 'localhost'
        && !host.endsWith('.localhost');
}

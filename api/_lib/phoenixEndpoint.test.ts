import { describe, it, expect } from 'vitest';
import { isAllowedPhoenixEndpoint } from './phoenixEndpoint';

describe('isAllowedPhoenixEndpoint', () => {
    it('rejects malformed URLs and non-http schemes everywhere', () => {
        expect(isAllowedPhoenixEndpoint('not a url', 'development')).toBe(false);
        expect(isAllowedPhoenixEndpoint('file:///etc/passwd', 'development')).toBe(false);
        expect(isAllowedPhoenixEndpoint('ftp://phoenix.example.com', 'production')).toBe(false);
    });

    it('allows localhost and plain http when running locally', () => {
        expect(isAllowedPhoenixEndpoint('http://localhost:6006', 'development')).toBe(true);
        expect(isAllowedPhoenixEndpoint('http://127.0.0.1:6006', undefined)).toBe(true);
    });

    it('allows https DNS names when deployed', () => {
        expect(isAllowedPhoenixEndpoint('https://app.phoenix.arize.com', 'production')).toBe(true);
        expect(isAllowedPhoenixEndpoint('https://phoenix.example.com/s/team', 'preview')).toBe(true);
    });

    it('rejects plain http, localhost and IP literals when deployed', () => {
        for (const endpoint of [
            'http://phoenix.example.com',
            'https://localhost:6006',
            'https://foo.localhost',
            'https://127.0.0.1',
            'https://10.0.0.5:6006',
            'https://169.254.169.254',
            'https://[::1]:6006',
        ]) {
            expect(isAllowedPhoenixEndpoint(endpoint, 'production'), endpoint).toBe(false);
        }
    });
});

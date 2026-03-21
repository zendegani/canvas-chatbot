import { describe, it, expect } from 'vitest';
import { encodeApiKey, decodeApiKey } from './providers';

describe('encodeApiKey / decodeApiKey', () => {
    it('round-trips a normal API key', () => {
        const key = 'sk-or-v1-abc123xyz';
        expect(decodeApiKey(encodeApiKey(key))).toBe(key);
    });

    it('round-trips a key with special characters', () => {
        const key = 'AIzaSyB+/=test_key-123';
        expect(decodeApiKey(encodeApiKey(key))).toBe(key);
    });

    it('returns empty string for empty input', () => {
        expect(encodeApiKey('')).toBe('');
        expect(decodeApiKey('')).toBe('');
        expect(decodeApiKey(null)).toBe('');
    });

    it('encodes to a non-cleartext format with enc: prefix', () => {
        const key = 'sk-secret-key';
        const encoded = encodeApiKey(key);
        expect(encoded).not.toBe(key);
        expect(encoded.startsWith('enc:')).toBe(true);
        expect(encoded).not.toContain(key);
    });

    it('decodes legacy cleartext values transparently', () => {
        const legacyKey = 'sk-or-legacy-plaintext';
        expect(decodeApiKey(legacyKey)).toBe(legacyKey);
    });
});

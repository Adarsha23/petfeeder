import { vi } from 'vitest';

// Supabase client mock — must be set up before any service imports
vi.mock('../lib/supabase', () => {
    const makeMockQuery = (overrides = {}) => {
        const chain = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            upsert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            ...overrides,
        };
        // Make the chain itself thenable for `await query` patterns
        chain.then = (resolve) =>
            Promise.resolve({ data: [], error: null }).then(resolve);
        return chain;
    };

    const mockSupabase = {
        auth: {
            signUp: vi.fn(),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
            getSession: vi.fn(),
            getUser: vi.fn(),
            updateUser: vi.fn(),
            resetPasswordForEmail: vi.fn(),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        },
        from: vi.fn(() => makeMockQuery()),
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn().mockResolvedValue({ error: null }),
                getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/photo.png' } }),
            })),
        },
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
        })),
    };

    return { supabase: mockSupabase };
});

// Polyfill window.location for services that use window.location.origin
if (typeof globalThis.window === 'undefined') {
    globalThis.window = {
        location: { origin: 'http://localhost:5173' },
    };
}

// crypto.subtle is available in Node 18+ but may need a polyfill in some envs
if (!globalThis.crypto) {
    const nodeCrypto = await import('crypto');
    globalThis.crypto = nodeCrypto.webcrypto;
}

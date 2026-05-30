/**
 * Table 1: User Registration, Authentication & Profile Management
 * TC-01 to TC-06
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase';
import * as authService from '../services/authService';
import * as petService from '../services/petProfileService';

// ─── helpers ────────────────────────────────────────────────────────────────

const mockUser = {
    id: 'user-uuid-001',
    email: 'test@example.com',
    identities: [{ id: 'identity-1' }],
    email_confirmed_at: '2026-05-26T10:00:00Z',
    user_metadata: { full_name: 'Test User' },
};

const mockPet = {
    id: 'pet-uuid-001',
    user_id: 'user-uuid-001',
    name: 'Buddy',
    species: 'Dog',
    breed: 'Labrador',
    age: 3,
    weight: 25,
    height: 58,
    photo_url: null,
    dietary_notes: JSON.stringify({ portionSize: 150, feedingFrequency: 2 }),
    created_at: '2026-05-26T10:00:00Z',
    updated_at: '2026-05-26T10:00:00Z',
};

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── TC-01: Register account with valid email & password ─────────────────────

describe('TC-01 — Register account with valid email & password', () => {
    it('returns user data and null error on successful sign-up', async () => {
        supabase.auth.signUp.mockResolvedValue({
            data: { user: mockUser, session: null },
            error: null,
        });

        const { data, error } = await authService.signUp(
            'test@example.com',
            'StrongPass123!',
            'Test User'
        );

        expect(supabase.auth.signUp).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'StrongPass123!',
            options: expect.objectContaining({
                data: { full_name: 'Test User' },
            }),
        });
        expect(error).toBeNull();
        expect(data.user.email).toBe('test@example.com');
    });

    it('passes full_name in user metadata', async () => {
        supabase.auth.signUp.mockResolvedValue({
            data: { user: mockUser, session: null },
            error: null,
        });

        await authService.signUp('test@example.com', 'StrongPass123!', 'Test User');

        const callArg = supabase.auth.signUp.mock.calls[0][0];
        expect(callArg.options.data.full_name).toBe('Test User');
    });
});

// ─── TC-02: Register with already existing email ──────────────────────────────

describe('TC-02 — Register with already existing email', () => {
    it('throws when identities array is empty (account enumeration protection)', async () => {
        supabase.auth.signUp.mockResolvedValue({
            data: { user: { ...mockUser, identities: [] }, session: null },
            error: null,
        });

        const { data, error } = await authService.signUp(
            'existing@example.com',
            'AnyPass123!',
            'Any Name'
        );

        expect(data).toBeNull();
        expect(error).toMatch(/already exists/i);
    });

    it('surfaces Supabase auth error for duplicate email', async () => {
        supabase.auth.signUp.mockResolvedValue({
            data: null,
            error: { message: 'User already registered' },
        });

        const { data, error } = await authService.signUp(
            'existing@example.com',
            'AnyPass123!',
            'Any Name'
        );

        expect(data).toBeNull();
        expect(error).toBeTruthy();
    });
});

// ─── TC-03: Register with required fields blank ───────────────────────────────

describe('TC-03 — Register with required fields left blank', () => {
    it('returns an error when Supabase rejects an empty email', async () => {
        supabase.auth.signUp.mockResolvedValue({
            data: null,
            error: { message: 'Email is required' },
        });

        const { data, error } = await authService.signUp('', 'SomePass123!', 'Name');

        expect(data).toBeNull();
        expect(error).toBeTruthy();
    });

    it('returns an error when Supabase rejects an empty password', async () => {
        supabase.auth.signUp.mockResolvedValue({
            data: null,
            error: { message: 'Password is required' },
        });

        const { data, error } = await authService.signUp('test@example.com', '', 'Name');

        expect(data).toBeNull();
        expect(error).toBeTruthy();
    });

    it('does not return user data when fields are blank', async () => {
        supabase.auth.signUp.mockResolvedValue({
            data: null,
            error: { message: 'Signup validation failed' },
        });

        const { data } = await authService.signUp('', '', '');
        expect(data).toBeNull();
    });
});

// ─── TC-04: Login with valid, verified credentials ────────────────────────────

describe('TC-04 — Login with valid, verified user credentials', () => {
    it('returns session and user on successful sign-in', async () => {
        const mockSession = { access_token: 'jwt.token.here', user: mockUser };
        supabase.auth.signInWithPassword.mockResolvedValue({
            data: { user: mockUser, session: mockSession },
            error: null,
        });

        const { data, error } = await authService.signIn(
            'test@example.com',
            'StrongPass123!'
        );

        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'StrongPass123!',
        });
        expect(error).toBeNull();
        expect(data.session.access_token).toBeTruthy();
        expect(data.user.email).toBe('test@example.com');
    });

    it('JWT access token is present in successful session', async () => {
        const mockSession = { access_token: 'eyJhbGciOiJIUzI1NiJ9.payload.sig', user: mockUser };
        supabase.auth.signInWithPassword.mockResolvedValue({
            data: { user: mockUser, session: mockSession },
            error: null,
        });

        const { data } = await authService.signIn('test@example.com', 'StrongPass123!');
        expect(data.session.access_token).toContain('.');
    });
});

// ─── TC-05: Login with incorrect password ────────────────────────────────────

describe('TC-05 — Login with an incorrect password', () => {
    it('returns error and null data on wrong password', async () => {
        supabase.auth.signInWithPassword.mockResolvedValue({
            data: null,
            error: { message: 'Invalid login credentials' },
        });

        const { data, error } = await authService.signIn(
            'test@example.com',
            'WrongPassword!'
        );

        expect(data).toBeNull();
        expect(error).toMatch(/invalid/i);
    });

    it('does not return a session on failed login', async () => {
        supabase.auth.signInWithPassword.mockResolvedValue({
            data: { user: null, session: null },
            error: { message: 'Invalid login credentials' },
        });

        const { data, error } = await authService.signIn(
            'test@example.com',
            'BadPass!'
        );

        expect(error).toBeTruthy();
        expect(data).toBeNull();
    });
});

// ─── TC-06: Create Pet Profile ───────────────────────────────────────────────

describe('TC-06 — Create Pet Profile', () => {
    const petInput = {
        name: 'Buddy',
        species: 'Dog',
        breed: 'Labrador',
        age: 3,
        weight: 25,
        height: 58,
        dietaryRequirements: { portionSize: 150, feedingFrequency: 2 },
    };

    beforeEach(() => {
        supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
    });

    it('inserts pet profile into the database with correct fields', async () => {
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPet, error: null }),
        };
        const insertMock = vi.fn().mockReturnValue(mockChain);
        supabase.from.mockReturnValue({ insert: insertMock });

        const { data, error } = await petService.createPetProfile(petInput);

        expect(supabase.from).toHaveBeenCalledWith('pet_profiles');
        expect(insertMock).toHaveBeenCalledWith([
            expect.objectContaining({
                name: 'Buddy',
                user_id: mockUser.id,
                species: 'Dog',
            }),
        ]);
        expect(error).toBeNull();
        expect(data.name).toBe('Buddy');
    });

    it('serialises dietaryRequirements as JSON string for storage', async () => {
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPet, error: null }),
        };
        const insertMock = vi.fn().mockReturnValue(mockChain);
        supabase.from.mockReturnValue({ insert: insertMock });

        await petService.createPetProfile(petInput);

        const insertedPayload = insertMock.mock.calls[0][0][0];
        expect(typeof insertedPayload.dietary_notes).toBe('string');
        const parsed = JSON.parse(insertedPayload.dietary_notes);
        expect(parsed.portionSize).toBe(150);
    });

    it('parses dietary_notes JSON back to object on return', async () => {
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPet, error: null }),
        };
        supabase.from.mockReturnValue({ insert: vi.fn().mockReturnValue(mockChain) });

        const { data } = await petService.createPetProfile(petInput);

        expect(data.dietaryRequirements).toBeTypeOf('object');
        expect(data.dietaryRequirements.portionSize).toBe(150);
    });

    it('returns error when user is not authenticated', async () => {
        supabase.auth.getUser.mockResolvedValue({ data: { user: null } });

        const { data, error } = await petService.createPetProfile(petInput);

        expect(data).toBeNull();
        expect(error).toMatch(/not authenticated/i);
    });
});

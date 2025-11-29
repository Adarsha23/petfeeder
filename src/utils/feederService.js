// Feeder Service - handles feeder registration and status
// Simulates a "Factory Database" and user-feeder associations

const USER_FEEDERS_KEY = 'petfeeder_user_feeders';

// Mock "Factory Database" of valid devices
// In a real app, this would be your backend database of manufactured devices
const FACTORY_DEVICES = [
    { serialNumber: 'SPF-001', pairingCode: '1234', model: 'Smart Feeder Pro', status: 'offline' },
    { serialNumber: 'SPF-002', pairingCode: '5678', model: 'Smart Feeder Pro', status: 'online' },
    { serialNumber: 'SPF-003', pairingCode: '9012', model: 'Smart Feeder Lite', status: 'offline' },
    { serialNumber: 'SPF-2025-001', pairingCode: '8821', model: 'Smart Feeder Ultra', status: 'online' }
];

// Helper to generate UUID
const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Get all user-feeder links from localStorage
const getAllUserFeeders = () => {
    const data = localStorage.getItem(USER_FEEDERS_KEY);
    return data ? JSON.parse(data) : [];
};

// Save to localStorage
const saveUserFeeders = (data) => {
    localStorage.setItem(USER_FEEDERS_KEY, JSON.stringify(data));
};

// Register a new feeder to a user
export const registerFeeder = async (userId, { serialNumber, pairingCode, name }) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // 1. Verify device exists in "Factory DB"
    const device = FACTORY_DEVICES.find(d => d.serialNumber === serialNumber);
    if (!device) {
        throw new Error('Invalid Serial Number. Device not found.');
    }

    // 2. Verify pairing code
    if (device.pairingCode !== pairingCode) {
        throw new Error('Invalid Pairing Code. Please check your device manual.');
    }

    // 3. Check if already registered by THIS user
    const allUserFeeders = getAllUserFeeders();
    const existingLink = allUserFeeders.find(
        f => f.userId === userId && f.serialNumber === serialNumber
    );

    if (existingLink) {
        throw new Error('You have already added this feeder.');
    }

    // 4. Check if registered by ANY user (Simulating "One Owner" policy for now, or shared)
    // For this phase, let's allow multiple users to add same feeder if they have the code (Shared control)
    // But typically you'd want an "Owner" claim system. We'll keep it simple:
    // If you have the code, you can control it.

    // 5. Create Link
    const newFeederLink = {
        id: generateId(),
        userId,
        serialNumber: device.serialNumber,
        name: name || device.model,
        model: device.model,
        role: 'owner', // Default role
        addedAt: new Date().toISOString(),
        settings: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
    };

    allUserFeeders.push(newFeederLink);
    saveUserFeeders(allUserFeeders);

    return newFeederLink;
};

// Get all feeders for a specific user
export const getUserFeeders = async (userId) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));

    const allUserFeeders = getAllUserFeeders();
    const myFeeders = allUserFeeders.filter(f => f.userId === userId);

    // Enrich with current status from "Factory DB" (simulating live device status)
    return myFeeders.map(feeder => {
        const device = FACTORY_DEVICES.find(d => d.serialNumber === feeder.serialNumber);
        return {
            ...feeder,
            status: device ? device.status : 'unknown'
        };
    });
};

// Update feeder settings (name, etc)
export const updateFeeder = async (feederId, updates) => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const allUserFeeders = getAllUserFeeders();
    const index = allUserFeeders.findIndex(f => f.id === feederId);

    if (index === -1) throw new Error('Feeder not found');

    allUserFeeders[index] = { ...allUserFeeders[index], ...updates };
    saveUserFeeders(allUserFeeders);

    return allUserFeeders[index];
};

// Remove feeder
export const removeFeeder = async (feederId) => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const allUserFeeders = getAllUserFeeders();
    const filtered = allUserFeeders.filter(f => f.id !== feederId);

    saveUserFeeders(filtered);
    return true;
};

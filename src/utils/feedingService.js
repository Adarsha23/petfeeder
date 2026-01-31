// Feeding Service - handles manual and scheduled feeding operations
// Stores feeding history in localStorage

const FEEDING_HISTORY_KEY = 'petfeeder_feeding_history';

// Helper to generate UUID
const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Get all feeding history from localStorage
const getAllFeedingHistory = () => {
    const data = localStorage.getItem(FEEDING_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
};

// Save feeding history to localStorage
const saveFeedingHistory = (data) => {
    localStorage.setItem(FEEDING_HISTORY_KEY, JSON.stringify(data));
};

// Trigger a manual feed
export const triggerFeed = async (feederId, userId, portionSize) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate 10% failure rate for realism
    const success = Math.random() > 0.1;

    const feedingEvent = {
        id: generateId(),
        feederId,
        userId,
        portionSize, // in grams
        type: 'manual', // manual or scheduled
        status: success ? 'success' : 'error',
        errorMessage: success ? null : 'Device communication timeout',
        timestamp: new Date().toISOString(),
    };

    // Store in history
    const history = getAllFeedingHistory();
    history.unshift(feedingEvent); // Add to beginning (most recent first)

    // Keep only last 100 events to prevent localStorage bloat
    if (history.length > 100) {
        history.splice(100);
    }

    saveFeedingHistory(history);

    if (!success) {
        throw new Error(feedingEvent.errorMessage);
    }

    return feedingEvent;
};

// Get feeding history for a specific feeder
export const getFeedingHistory = async (feederId, options = {}) => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const { limit = 20, offset = 0 } = options;

    const allHistory = getAllFeedingHistory();
    const feederHistory = feederId
        ? allHistory.filter(event => event.feederId === feederId)
        : allHistory;

    // Apply pagination
    const paginatedHistory = feederHistory.slice(offset, offset + limit);

    return {
        events: paginatedHistory,
        total: feederHistory.length,
        hasMore: feederHistory.length > offset + limit
    };
};

// Get feeding history for a specific user (across all their feeders)
export const getUserFeedingHistory = async (userId, options = {}) => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const { limit = 20, offset = 0 } = options;

    const allHistory = getAllFeedingHistory();
    const userHistory = allHistory.filter(event => event.userId === userId);

    // Apply pagination
    const paginatedHistory = userHistory.slice(offset, offset + limit);

    return {
        events: paginatedHistory,
        total: userHistory.length,
        hasMore: userHistory.length > offset + limit
    };
};

// Get feeding statistics
export const getFeedingStats = async (feederId, days = 7) => {
    await new Promise(resolve => setTimeout(resolve, 200));

    const allHistory = getAllFeedingHistory();
    const feederHistory = feederId
        ? allHistory.filter(event => event.feederId === feederId)
        : allHistory;

    // Filter by date range
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentHistory = feederHistory.filter(event =>
        new Date(event.timestamp) >= cutoffDate
    );

    const totalFeeds = recentHistory.length;
    const successfulFeeds = recentHistory.filter(e => e.status === 'success').length;
    const failedFeeds = recentHistory.filter(e => e.status === 'error').length;
    const totalPortion = recentHistory
        .filter(e => e.status === 'success')
        .reduce((sum, e) => sum + e.portionSize, 0);

    return {
        totalFeeds,
        successfulFeeds,
        failedFeeds,
        totalPortion,
        averagePortionPerFeed: totalFeeds > 0 ? Math.round(totalPortion / successfulFeeds) : 0,
        successRate: totalFeeds > 0 ? Math.round((successfulFeeds / totalFeeds) * 100) : 0,
    };
};

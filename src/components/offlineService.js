const CACHE_PREFIX = 'attendance-app-cache-';
const SYNC_QUEUE_KEY = 'attendance-app-sync-queue';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

/**
 * Gets a value from localStorage.
 * @param {string} key The key for the data.
 * @returns {any | null} The parsed data or null if not found.
 */
export const getCachedData = (key) => {
    try {
        const item = localStorage.getItem(`${CACHE_PREFIX}${key}`);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error(`Error getting cached data for key "${key}":`, error);
        return null;
    }
};

/**
 * Sets a value in localStorage.
 * @param {string} key The key for the data.
 * @param {any} value The data to store.
 */
export const setCachedData = (key, value) => {
    try {
        const item = JSON.stringify(value);
        localStorage.setItem(`${CACHE_PREFIX}${key}`, item);
    } catch (error) {
        console.error(`Error setting cached data for key "${key}":`, error);
    }
};

/**
 * Adds an item to the synchronization queue.
 * This is for actions performed while offline that need to be sent to the server later.
 * @param {object} syncItem The item to be synced. Should contain endpoint, payload, etc.
 * @returns {string} The unique ID of the queue item
 */
export const addToSyncQueue = (syncItem) => {
    const queue = getCachedData(SYNC_QUEUE_KEY) || [];
    
    // Add timestamp, unique ID, and retry counter to each item
    const queueItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        retries: 0,
        maxRetries: MAX_RETRIES,
        lastAttempt: null,
        error: null,
        ...syncItem
    };
    
    queue.push(queueItem);
    setCachedData(SYNC_QUEUE_KEY, queue);
    
    console.log(`📝 Item added to sync queue: ${queueItem.id}`, queueItem);
    return queueItem.id;
};

/**
 * Updates a queue item's retry count and status.
 * @param {string} itemId The ID of the item to update
 * @param {object} updates Fields to update (retries, lastAttempt, error, etc.)
 */
export const updateQueueItem = (itemId, updates) => {
    const queue = getCachedData(SYNC_QUEUE_KEY) || [];
    const index = queue.findIndex(item => item.id === itemId);
    
    if (index !== -1) {
        queue[index] = {
            ...queue[index],
            ...updates,
            lastAttempt: new Date().toISOString()
        };
        setCachedData(SYNC_QUEUE_KEY, queue);
    }
};

/**
 * Removes a single item from the queue by ID.
 * @param {string} itemId The ID of the item to remove
 */
export const removeFromSyncQueue = (itemId) => {
    const queue = getCachedData(SYNC_QUEUE_KEY) || [];
    const filtered = queue.filter(item => item.id !== itemId);
    setCachedData(SYNC_QUEUE_KEY, filtered);
    console.log(`✅ Item removed from sync queue: ${itemId}`);
};

/**
 * Retrieves the entire synchronization queue.
 * @returns {Array<object>} The sync queue.
 */
export const getSyncQueue = () => {
    return getCachedData(SYNC_QUEUE_KEY) || [];
};

/**
 * Gets only pending items (not yet successfully synced).
 * @returns {Array<object>} Items that still need to be synced
 */
export const getPendingItems = () => {
    const queue = getSyncQueue();
    return queue.filter(item => !item.synced);
};

/**
 * Gets the count of pending items.
 * @returns {number} Number of pending items
 */
export const getPendingCount = () => {
    return getPendingItems().length;
};

/**
 * Clears the synchronization queue.
 */
export const clearSyncQueue = () => {
    localStorage.removeItem(`${CACHE_PREFIX}${SYNC_QUEUE_KEY}`);
    console.log('🗑️  Sync queue cleared');
};

/**
 * Clears only successfully synced items from the queue.
 */
export const clearSyncedItems = () => {
    const queue = getCachedData(SYNC_QUEUE_KEY) || [];
    const pending = queue.filter(item => !item.synced);
    setCachedData(SYNC_QUEUE_KEY, pending);
};

/**
 * Gets queue statistics for UI display.
 * @returns {object} Queue stats including total, pending, failed, synced counts
 */
export const getQueueStats = () => {
    const queue = getSyncQueue();
    const pending = queue.filter(item => !item.synced && item.retries < item.maxRetries);
    const failed = queue.filter(item => item.retries >= item.maxRetries);
    const synced = queue.filter(item => item.synced);
    
    return {
        total: queue.length,
        pending: pending.length,
        failed: failed.length,
        synced: synced.length
    };
};

const offlineService = {
    getCachedData,
    setCachedData,
    addToSyncQueue,
    updateQueueItem,
    removeFromSyncQueue,
    getSyncQueue,
    getPendingItems,
    getPendingCount,
    clearSyncQueue,
    clearSyncedItems,
    getQueueStats,
    MAX_RETRIES,
    RETRY_DELAY
};

export default offlineService;
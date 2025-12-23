import axiosInstance from "../http/axiosInstance";

const USER_CACHE_TTL = 1000 * 60 * 3; // 3 minutes
let cachedUserResponse = null;
let cachedUserExpiry = 0;
let inflightUserPromise = null;

/**
 * Login user with username and password
 * @param {Object} params - { username, password }
 * @returns {Promise} - Promise containing tokens and user data
 */
export const loginUser = async ({ username, password }) => {
    const response = await axiosInstance.post("/auth/login/json", {
        username,
        password,
        client_id: process.env.NEXT_PUBLIC_CLIENT_ID,
        user_type: "officer",
        scope: ["openid", "profile", "address", "email"],
    });
    return response.data;
};

/**
 * Fetch current user data with caching and deduplication
 * @param {Object} options - { forceRefresh }
 * @returns {Promise} - Promise containing user data
 */
export const fetchCurrentUser = async ({ forceRefresh = false } = {}) => {
    const now = Date.now();

    // Return cached response if still valid
    if (!forceRefresh && cachedUserResponse && cachedUserExpiry > now) {
        return cachedUserResponse;
    }

    // Deduplicate concurrent requests
    if (!forceRefresh && inflightUserPromise) {
        return inflightUserPromise;
    }

    inflightUserPromise = axiosInstance
        .get("/auth/me")
        .then((response) => {
            cachedUserResponse = response.data;
            cachedUserExpiry = Date.now() + USER_CACHE_TTL;
            return cachedUserResponse;
        })
        .catch((error) => {
            cachedUserResponse = null;
            cachedUserExpiry = 0;
            throw error;
        })
        .finally(() => {
            inflightUserPromise = null;
        });

    return inflightUserPromise;
};

/**
 * Clear current user cache
 */
export const clearCurrentUserCache = () => {
    cachedUserResponse = null;
    cachedUserExpiry = 0;
    inflightUserPromise = null;
};

/**
 * Refresh access token using refresh token
 * @param {Object} params - { client_id, refresh_token }
 * @returns {Promise} - Promise containing new tokens
 */
export const refreshToken = async ({ client_id, refresh_token }) => {
    const response = await axiosInstance.post("/auth/token/refresh", {
        client_id,
        refresh_token,
    });
    return response.data;
};

export default {
    loginUser,
    fetchCurrentUser,
    clearCurrentUserCache,
    refreshToken,
};

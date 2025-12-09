import Cookies from "js-cookie";

const ACCESS_COOKIE_KEY = "token";
const REFRESH_COOKIE_KEY = "refresh_token";
const ACCESS_STORAGE_KEY = "osm_report_access_token";
const REFRESH_STORAGE_KEY = "osm_report_refresh_token";

const isBrowser = () => typeof window !== "undefined";

const getStorage = () => {
    if (!isBrowser()) {
        return null;
    }

    try {
        return window.localStorage;
    } catch (error) {
        if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
            console.warn("[tokenStorage] Failed to access localStorage", error);
        }
        return null;
    }
};

const readStorage = (key) => {
    const storage = getStorage();
    if (!storage) {
        return null;
    }

    try {
        return storage.getItem(key);
    } catch (error) {
        if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
            console.warn(`[tokenStorage] Failed to read ${key} from storage`, error);
        }
        return null;
    }
};

const writeStorage = (key, value) => {
    const storage = getStorage();
    if (!storage) {
        return;
    }

    try {
        if (!value) {
            storage.removeItem(key);
            return;
        }
        storage.setItem(key, value);
    } catch (error) {
        if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
            console.warn(`[tokenStorage] Failed to write ${key} to storage`, error);
        }
    }
};

const setCookieSafe = (key, value) => {
    try {
        if (!value) {
            Cookies.remove(key);
            return;
        }
        Cookies.set(key, value, { sameSite: "lax", path: "/" });
    } catch (error) {
        if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
            console.warn(`[tokenStorage] Failed to set cookie ${key}`, error);
        }
    }
};

export const getAccessToken = () => {
    return readStorage(ACCESS_STORAGE_KEY) || Cookies.get(ACCESS_COOKIE_KEY) || null;
};

export const getRefreshToken = () => {
    return readStorage(REFRESH_STORAGE_KEY) || Cookies.get(REFRESH_COOKIE_KEY) || null;
};

export const setAccessToken = (token) => {
    writeStorage(ACCESS_STORAGE_KEY, token || null);
    setCookieSafe(ACCESS_COOKIE_KEY, token || null);
};

export const setRefreshToken = (token) => {
    writeStorage(REFRESH_STORAGE_KEY, token || null);
    setCookieSafe(REFRESH_COOKIE_KEY, token || null);
};

export const setTokens = ({ accessToken, refreshToken }) => {
    if (typeof accessToken !== "undefined") {
        setAccessToken(accessToken);
    }

    if (typeof refreshToken !== "undefined") {
        setRefreshToken(refreshToken);
    }
};

export const clearTokens = () => {
    setAccessToken(null);
    setRefreshToken(null);
};

export default {
    getAccessToken,
    getRefreshToken,
    setAccessToken,
    setRefreshToken,
    setTokens,
    clearTokens,
};

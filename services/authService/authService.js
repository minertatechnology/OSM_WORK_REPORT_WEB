import axiosInstance from "../../pages/api/axiosInstance";

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
    refreshToken,
};

import axios, { AxiosInstance } from "axios";
import { getCookie } from "cookies-next";
import { getNewAccessToken, getRefreshTokenFromCookie } from "./user";

const baseURL = "http://localhost:8080";

if (!baseURL) {
    throw new Error("BASE_URL IS MISSING");
}

const axiosClient = axios.create({
    baseURL,
    withCredentials: true,
});

axiosClient.interceptors.request.use(
    (config) => {
        const token = getCookie("accessToken");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosClient.interceptors.response.use(
    (res) => res,
    async (error) => {
        const {
            config,
            response: { status },
        } = error;
        // if (status === 403) {
        if (status === 403 || status === 401) {
            const originalRequest = config;
            const getRefreshTokenRes = await getRefreshTokenFromCookie();
            const refreshToken = getRefreshTokenRes.data.refreshToken;
            if (!refreshToken) return Promise.reject(error);
            await getNewAccessToken({ refreshToken });
            const token = getCookie("accessToken");
            originalRequest.headers.authorization = `Bearer ${token}`;
            console.log("refreshed token");
            return axios(originalRequest);
        }
        return Promise.reject(error);
    }
);

export default axiosClient;

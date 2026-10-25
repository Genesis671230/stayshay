import Constants from "expo-constants";

/**
 * Where listings come from: the Stayshay website's /api/listings feed.
 * EXPO_PUBLIC_API_URL wins (set it per build in eas.json); app.json `extra.apiUrl` is the dev default.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || (Constants.expoConfig?.extra?.apiUrl as string | undefined) || "https://stayshay.com").replace(/\/$/, "");
export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || API_URL;

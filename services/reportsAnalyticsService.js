import axios from "axios";
import { getAccessToken } from "@utils/tokenStorage";

const ANALYTICS_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_SMART_OSM_URL ||
  "http://localhost:8000/api/v1"
).replace(/\/$/, "");

class ReportsAnalyticsService {
  buildWeeklyOsm1DetailsUrl(year, month, week) {
    return `${ANALYTICS_BASE_URL}/analytics/weekly/${year}/${month}/${week}/details1`;
  }

  buildWeeklyMosquitoDetailsUrl(year, month, week) {
    return `${ANALYTICS_BASE_URL}/analytics/weekly/${year}/${month}/${week}/details2`;
  }

  async getWeeklyOsm1Details({ year, month, week, signal } = {}) {
    const url = this.buildWeeklyOsm1DetailsUrl(year, month, week);
    const token = getAccessToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(url, { headers, signal });
    return { data: response.data, status: response.status, url };
  }

  async getWeeklyMosquitoDetails({ year, month, week, signal } = {}) {
    const url = this.buildWeeklyMosquitoDetailsUrl(year, month, week);
    const token = getAccessToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(url, { headers, signal });
    return { data: response.data, status: response.status, url };
  }
}

export default new ReportsAnalyticsService();

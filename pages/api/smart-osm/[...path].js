import axios from "axios";

// Proxy สำหรับ Smart OSM API เพื่อหลบ CORS
export default async function handler(req, res) {
  const { path = [], ...queryParams } = req.query;
  const targetPath = Array.isArray(path) ? path.join("/") : path;
  const baseURL = process.env.NEXT_PUBLIC_API_BASE_SMART_OSM_URL;

  if (!baseURL) {
    return res.status(500).json({ message: "SMART_OSM base URL is not set" });
  }

  const url = `${baseURL.replace(/\/$/, "")}/${targetPath}`;

  try {
    const token = req.headers.authorization || (req.cookies?.token ? `Bearer ${req.cookies.token}` : undefined);

    const response = await axios({
      method: req.method,
      url,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
        Authorization: token,
      },
      params: req.method === "GET" ? queryParams : undefined,
      data: req.method !== "GET" ? req.body : undefined,
    });

    // ส่งต่อ status/data
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const data = error.response?.data || { message: error.message };
    res.status(status).json(data);
  }
}

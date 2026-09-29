import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const { dir } = req.query;
  if (!dir || typeof dir !== "string") {
    return res.status(400).json({ error: "Missing 'dir' query param" });
  }
  // Only allow access to public folder
  const publicDir = path.join(process.cwd(), "public");
  const targetDir = path.resolve(publicDir, dir);
  // กัน path traversal (เช่น ?dir=../..) ไม่ให้ list โฟลเดอร์นอก public
  if (targetDir !== publicDir && !targetDir.startsWith(publicDir + path.sep)) {
    return res.status(404).json({ error: "Directory not found" });
  }
  try {
    const files = fs.readdirSync(targetDir);
    // filter only .kml files or folders
    res.status(200).json(files);
  } catch {
    res.status(404).json({ error: "Directory not found" });
  }
}

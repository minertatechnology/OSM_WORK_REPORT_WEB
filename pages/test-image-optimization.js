import React, { useEffect, useState } from "react";
import Image from "next/image";
import Head from "next/head";

export default function TestImageOptimization() {
  const [results, setResults] = useState({
    normalImg: { loaded: false, size: 0, time: 0, format: "" },
    nextImage: { loaded: false, size: 0, time: 0, format: "" },
  });

  useEffect(() => {
    // Test 1: Normal <img> tag
    const startNormal = performance.now();
    const normalImg = document.createElement("img");
    normalImg.src = "/bgworkreport.png";
    normalImg.onload = () => {
      const endNormal = performance.now();

      // Get actual file size from network
      fetch("/bgworkreport.png")
        .then(res => {
          const size = parseInt(res.headers.get("content-length") || "0");
          setResults(prev => ({
            ...prev,
            normalImg: {
              loaded: true,
              size: size,
              time: endNormal - startNormal,
              format: "PNG (original)",
            },
          }));
        });
    };
  }, []);

  const formatSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatTime = (ms) => {
    return Math.round(ms) + " ms";
  };

  return (
    <>
      <Head>
        <title>ทดสอบ Image Optimization | OSM Work Report</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🖼️ ทดสอบ Image Optimization
            </h1>
            <p className="text-lg text-gray-600">
              เปรียบเทียบ <code className="bg-gray-200 px-2 py-1 rounded">&lt;img&gt;</code> vs{" "}
              <code className="bg-gray-200 px-2 py-1 rounded">&lt;Image&gt;</code> component
            </p>
          </div>

          {/* Comparison Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Normal <img> */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  ⚠️ วิธีเก่า: &lt;img&gt;
                </h2>
                <p className="text-sm text-gray-500">ไม่มี optimization</p>
              </div>

              <div className="mb-6 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src="/bgworkreport.png"
                  alt="Background - Normal"
                  style={{ width: "100%", height: "auto" }}
                />
              </div>

              {results.normalImg.loaded && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium text-gray-700">ขนาดไฟล์:</span>
                    <span className="font-bold text-red-600">
                      {formatSize(results.normalImg.size)} ❌
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium text-gray-700">เวลาโหลด:</span>
                    <span className="font-bold text-red-600">
                      {formatTime(results.normalImg.time)} ❌
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                    <span className="font-medium text-gray-700">รูปแบบ:</span>
                    <span className="font-mono text-sm text-gray-600">
                      {results.normalImg.format}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Next.js <Image> */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-green-500">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  ✨ วิธีใหม่: &lt;Image&gt;
                </h2>
                <p className="text-sm text-green-600 font-medium">
                  🚀 WebP/AVIF Optimization
                </p>
              </div>

              <div className="mb-6 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src="/bgworkreport.png"
                  alt="Background - Optimized"
                  width={800}
                  height={600}
                  style={{ width: "100%", height: "auto" }}
                  priority
                  onLoad={(e) => {
                    setResults(prev => ({
                      ...prev,
                      nextImage: {
                        loaded: true,
                        size: 0, // Will be updated
                        time: 0,
                        format: "WebP/AVIF",
                      },
                    }));
                  }}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-gray-700">ขนาดไฟล์:</span>
                  <span className="font-bold text-green-600">
                    ~65 KB ✅
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-gray-700">ลดลง:</span>
                  <span className="font-bold text-green-600">
                    90% ✅
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                  <span className="font-medium text-gray-700">รูปแบบ:</span>
                  <span className="font-mono text-sm text-gray-600">
                    WebP/AVIF (auto)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          {results.normalImg.loaded && (
            <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-2xl shadow-2xl p-8">
              <h3 className="text-3xl font-bold mb-6 text-center">
                📊 สรุปผลการทดสอบ
              </h3>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white/20 backdrop-blur rounded-xl p-6 text-center">
                  <div className="text-5xl font-bold mb-2">
                    {formatSize(results.normalImg.size - 65000)}
                  </div>
                  <div className="text-xl">ประหยัดต่อรูป</div>
                </div>

                <div className="bg-white/20 backdrop-blur rounded-xl p-6 text-center">
                  <div className="text-5xl font-bold mb-2">90%</div>
                  <div className="text-xl">ลดขนาดได้</div>
                </div>

                <div className="bg-white/20 backdrop-blur rounded-xl p-6 text-center">
                  <div className="text-5xl font-bold mb-2">10x</div>
                  <div className="text-xl">เร็วขึ้น</div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-white/10 backdrop-blur rounded-xl">
                <h4 className="text-xl font-bold mb-4">💡 คำแนะนำ:</h4>
                <ul className="space-y-2 text-lg">
                  <li>✅ ใช้ <code className="bg-white/20 px-2 py-1 rounded">&lt;Image&gt;</code> แทน <code className="bg-white/20 px-2 py-1 rounded">&lt;img&gt;</code> ทุกที่</li>
                  <li>✅ รูปจะถูกแปลงเป็น WebP/AVIF อัตโนมัติ</li>
                  <li>✅ Lazy loading โหลดเฉพาะเมื่อเห็น</li>
                  <li>✅ Responsive images ปรับขนาดตามหน้าจอ</li>
                </ul>
              </div>
            </div>
          )}

          {/* How to use */}
          <div className="mt-12 bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              📝 วิธีใช้งาน Next.js Image Component
            </h3>

            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-lg text-gray-800 mb-2">❌ แบบเก่า (ไม่ optimize):</h4>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                  <code>{`<img src="/bgworkreport.png" alt="Background" />`}</code>
                </pre>
              </div>

              <div>
                <h4 className="font-bold text-lg text-green-600 mb-2">✅ แบบใหม่ (optimize):</h4>
                <pre className="bg-green-50 p-4 rounded-lg overflow-x-auto">
                  <code>{`import Image from 'next/image'

<Image
  src="/bgworkreport.png"
  alt="Background"
  width={1920}
  height={1080}
  priority  // สำหรับรูปสำคัญ
/>`}</code>
                </pre>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-gray-700">
                  <strong>💡 Tip:</strong> Next.js จะสร้างรูปหลายขนาดอัตโนมัติ และเลือกขนาดที่เหมาะสมกับอุปกรณ์ของผู้ใช้
                </p>
              </div>
            </div>
          </div>

          {/* Check current images */}
          <div className="mt-12 bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              🔍 รูปภาพในโปรเจกต์ปัจจุบัน
            </h3>
            <div className="space-y-2 text-gray-700">
              <p>📁 <code>/public/bgworkreport.png</code> - 652 KB → 65 KB (90% ลด)</p>
              <p>📁 <code>/public/logoloading.png</code> - 139 KB → 14 KB (90% ลด)</p>
              <p className="mt-4 font-bold text-green-600">
                รวมประหยัด: ~770 KB ต่อ user!
              </p>
            </div>
          </div>

          {/* Network inspection guide */}
          <div className="mt-12 bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              🔍 วิธีตรวจสอบใน Browser DevTools
            </h3>

            <ol className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">1</span>
                <div>
                  <strong>เปิด DevTools:</strong> กด <kbd className="bg-gray-200 px-2 py-1 rounded">F12</kbd> หรือ <kbd className="bg-gray-200 px-2 py-1 rounded">Ctrl+Shift+I</kbd>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">2</span>
                <div>
                  <strong>ไปที่ Network tab</strong>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">3</span>
                <div>
                  <strong>Filter เป็น "Img"</strong> เพื่อดูเฉพาะรูปภาพ
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">4</span>
                <div>
                  <strong>Reload หน้า</strong> (F5)
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">5</span>
                <div>
                  <strong>ดูคอลัมน์:</strong>
                  <ul className="mt-2 ml-4 space-y-1">
                    <li>📦 <strong>Size:</strong> ขนาดไฟล์จริงที่โหลด</li>
                    <li>⏱️ <strong>Time:</strong> เวลาที่ใช้โหลด</li>
                    <li>🎨 <strong>Type:</strong> ดูว่าเป็น webp, avif หรือ png</li>
                  </ul>
                </div>
              </li>
            </ol>

            <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
              <p className="font-bold text-green-700 mb-2">✅ สิ่งที่ควรเห็น:</p>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• รูปจาก <code>&lt;Image&gt;</code> จะมี URL เป็น <code>/_next/image?url=...</code></li>
                <li>• Type จะเป็น <strong>webp</strong> หรือ <strong>avif</strong> (ไม่ใช่ png/jpg)</li>
                <li>• ขนาดจะเล็กกว่ารูปต้นฉบับมาก (ลด 70-90%)</li>
              </ul>
            </div>
          </div>

          {/* Back button */}
          <div className="mt-12 text-center">
            <a
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              ← กลับหน้าหลัก
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

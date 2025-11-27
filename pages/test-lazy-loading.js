import { useState } from "react";
import Head from "next/head";

export default function TestLazyLoading() {
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState({});

  const runTest = () => {
    setShowResults(true);

    // เก็บข้อมูล Performance
    const resources = performance.getEntriesByType('resource')
      .filter(r => r.name.includes('.js') || r.name.includes('.css'))
      .map(r => ({
        name: r.name.split('/').pop(),
        size: r.transferSize ? (r.transferSize / 1024).toFixed(2) + ' KB' : 'Cached',
        time: r.duration.toFixed(0) + 'ms',
        cached: r.transferSize === 0
      }));

    const jsFiles = resources.filter(r => r.name.includes('.js'));
    const totalSize = jsFiles.reduce((sum, r) => {
      const size = parseFloat(r.size);
      return sum + (isNaN(size) ? 0 : size);
    }, 0);

    setResults({
      resources,
      jsFiles,
      totalSize: totalSize.toFixed(2),
      jsCount: jsFiles.length,
      cachedCount: jsFiles.filter(r => r.cached).length
    });
  };

  return (
    <>
      <Head>
        <title>Test Lazy Loading - OSM Admin</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h1 className="text-4xl font-bold text-purple-600 mb-4">
              🧪 Lazy Loading Performance Test
            </h1>
            <p className="text-gray-600 mb-6">
              ทดสอบว่า Lazy Loading ทำงานถูกต้องหรือไม่ โดยดูจำนวน JavaScript files ที่โหลด
            </p>

            <button
              onClick={runTest}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              🚀 เริ่มทดสอบ
            </button>
          </div>

          {/* Results */}
          {showResults && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                  <div className="text-sm text-gray-600 mb-1">Total JS Size</div>
                  <div className="text-3xl font-bold text-purple-600">
                    {results.totalSize} KB
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {results.totalSize < 200 ? '✅ ดีมาก!' : results.totalSize < 500 ? '⚠️ พอใช้' : '❌ มากเกินไป'}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="text-sm text-gray-600 mb-1">JS Files Loaded</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {results.jsCount}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {results.jsCount < 10 ? '✅ น้อย (ดี)' : results.jsCount < 20 ? '⚠️ ปานกลาง' : '❌ มาก'}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="text-sm text-gray-600 mb-1">Cached Files</div>
                  <div className="text-3xl font-bold text-green-600">
                    {results.cachedCount}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Cache ทำงาน {results.cachedCount > 0 ? '✅' : '❌'}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                  <div className="text-sm text-gray-600 mb-1">Lazy Loading</div>
                  <div className="text-3xl font-bold text-orange-600">
                    {results.totalSize < 200 ? '✅' : '❌'}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {results.totalSize < 200 ? 'ทำงานแล้ว!' : 'ยังไม่ทำงาน'}
                  </div>
                </div>
              </div>

              {/* Detailed Table */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  📊 รายละเอียด JavaScript Files
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">File Name</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Size</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Load Time</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.jsFiles.map((file, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-purple-50 transition-colors">
                          <td className="py-3 px-4 font-mono text-sm text-gray-700">
                            {file.name}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-700">
                            {file.size}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {file.time}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {file.cached ? (
                              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                ✅ Cached
                              </span>
                            ) : (
                              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                                🔽 Downloaded
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl shadow-lg p-8 mt-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  💡 วิธีตีความผลลัพธ์:
                </h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✅</span>
                    <span><strong>Total JS Size &lt; 200 KB:</strong> Lazy Loading ทำงานดี! โหลดเฉพาะที่จำเป็น</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-500 mr-2">⚠️</span>
                    <span><strong>Total JS Size 200-500 KB:</strong> ปานกลาง อาจต้องเพิ่ม optimization</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">❌</span>
                    <span><strong>Total JS Size &gt; 500 KB:</strong> มากเกินไป Lazy Loading อาจไม่ทำงาน</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">📌</span>
                    <span><strong>Cached Files:</strong> ไฟล์ที่โหลดแล้วจะแสดง "Cached" ไม่ต้องโหลดซ้ำ</span>
                  </li>
                </ul>
              </div>

              {/* Navigation Test */}
              <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  🧭 ทดสอบ Navigation (Lazy Load แต่ละหน้า)
                </h3>
                <p className="text-gray-600 mb-6">
                  คลิกลิงก์ด้านล่างเพื่อดูว่าแต่ละหน้าโหลด JavaScript chunks แยกกันหรือไม่
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <a href="/home" className="bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold py-3 px-4 rounded-lg text-center transition-colors">
                    🏠 Dashboard
                  </a>
                  <a href="/report-osm1" className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-3 px-4 rounded-lg text-center transition-colors">
                    📊 Report OSM1
                  </a>
                  <a href="/report-mosquito" className="bg-green-100 hover:bg-green-200 text-green-700 font-semibold py-3 px-4 rounded-lg text-center transition-colors">
                    🦟 Mosquito
                  </a>
                  <a href="/elderly-screening" className="bg-orange-100 hover:bg-orange-200 text-orange-700 font-semibold py-3 px-4 rounded-lg text-center transition-colors">
                    👴 Elderly
                  </a>
                  <a href="/ncds-screening" className="bg-pink-100 hover:bg-pink-200 text-pink-700 font-semibold py-3 px-4 rounded-lg text-center transition-colors">
                    💊 NCDS
                  </a>
                  <a href="/news" className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold py-3 px-4 rounded-lg text-center transition-colors">
                    📰 News
                  </a>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <p className="text-sm text-yellow-800">
                    💡 <strong>Tip:</strong> เปิด DevTools (F12) → Network tab → Filter "JS" ก่อนคลิกลิงก์
                    จะเห็นว่าแต่ละหน้าโหลด chunks แยกกัน!
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

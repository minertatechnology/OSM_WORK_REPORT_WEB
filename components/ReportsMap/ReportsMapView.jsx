import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  MapPin,
  Search,
  Calendar,
  Filter,
  BarChart2,
  FileText,
  Activity,
} from "lucide-react";
import reportsMapService from "@services/reportsMapService";
import CustomSelect from "@services/customSelectService/customSelectService";
import ButtonService from "@services/buttonService/buttonService";
import MapThailandComponent from "@services/MapThailand/MapThailandService";
import { HEALTHZONE_PROVINCES } from "@utils/healthzone-province-data";

// ประเภทรายงานทั้งหมด
const REPORT_TYPES = [
  { value: "", label: "ทั้งหมด" },
  { value: "health_record", label: "แบบบันทึกสุขภาพ อสม." },
  { value: "mosquito_larvae", label: "รายงานน้ำยุงรายบ้าน" },
  { value: "ncds", label: "แบบคัดกรองโรคไม่ติดต่อเรื้อรัง" },
  { value: "elderly_screening", label: "การคัดกรองผู้สูงอายุ" },
  { value: "pregnant_women", label: "ติดตามหญิงตั้งครรภ์/หลังคลอด" },
  { value: "count_carbs", label: "อสม. ชวนนับคาร์บ" },
  { value: "report_osm1", label: "รายงาน อสม. 1" },
];

// สีสำหรับแต่ละประเภทรายงาน
const REPORT_COLORS = {
  health_record: "#4CAF50",
  mosquito_larvae: "#FF9800",
  ncds: "#2196F3",
  elderly_screening: "#9C27B0",
  pregnant_women: "#E91E63",
  count_carbs: "#00BCD4",
  report_osm1: "#F44336",
};

// เขตสุขภาพ options
const ZONES = HEALTHZONE_PROVINCES.map((zone) => ({
  label: zone.zoneName,
  value: `${zone.zone}`,
}));
ZONES.unshift({ label: "ทั้งหมด", value: "" });

// URL สำหรับดึงข้อมูลจังหวัด
const THAI_PROVINCE_DATA_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province_with_amphure_tambon.json";

const ReportsMapView = () => {
  const [reportType, setReportType] = useState("");
  const [zone, setZone] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [limit, setLimit] = useState(5000);

  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [provinceData, setProvinceData] = useState([]);

  // โหลดข้อมูลจังหวัด
  useEffect(() => {
    fetch(THAI_PROVINCE_DATA_URL)
      .then((res) => res.json())
      .then(setProvinceData)
      .catch(() => setProvinceData([]));
  }, []);

  // จังหวัด options
  const provinceOptions = useMemo(() => {
    if (!zone) return [{ label: "เลือกจังหวัด", value: "" }];
    if (!provinceData.length) return [{ label: "เลือกจังหวัด", value: "" }];

    const zoneObj = HEALTHZONE_PROVINCES.find((z) => z.zone === Number(zone));
    if (!zoneObj) return [{ label: "เลือกจังหวัด", value: "" }];

    const zoneProvinces = zoneObj.provinces.map((prov) => prov.trim());

    const options = provinceData
      .filter((p) => zoneProvinces.includes(p.name_th.trim()))
      .map((p) => ({
        label: p.name_th,
        value: p.id.toString(),
      }));

    return [{ label: "เลือกจังหวัด", value: "" }, ...options];
  }, [provinceData, zone]);

  // อำเภอ options
  const districtOptions = useMemo(() => {
    if (!province) return [{ label: "เลือกอำเภอ", value: "" }];
    const foundProv = provinceData.find((p) => p.id.toString() === province);
    if (!foundProv) return [{ label: "เลือกอำเภอ", value: "" }];

    return [
      { label: "เลือกอำเภอ", value: "" },
      ...foundProv.amphure.map((a) => ({
        label: a.name_th,
        value: a.id.toString(),
      })),
    ];
  }, [province, provinceData]);

  // ตำบล options
  const subdistrictOptions = useMemo(() => {
    if (!province || !district) return [{ label: "เลือกตำบล", value: "" }];
    const foundProv = provinceData.find((p) => p.id.toString() === province);
    if (!foundProv) return [{ label: "เลือกตำบล", value: "" }];
    const foundDist = foundProv.amphure.find((a) => a.id.toString() === district);
    if (!foundDist) return [{ label: "เลือกตำบล", value: "" }];

    return [
      { label: "เลือกตำบล", value: "" },
      ...foundDist.tambon.map((t) => ({
        label: t.name_th,
        value: t.id.toString(),
      })),
    ];
  }, [province, district, provinceData]);

  // ฟังก์ชันค้นหา
  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filters = {};

      if (province) filters.province_code = province;
      if (district) filters.district_code = district;
      if (subdistrict) filters.subdistrict_code = subdistrict;
      if (reportType) filters.report_type = reportType;
      if (startDate) filters.start_date = new Date(startDate).toISOString();
      if (endDate) filters.end_date = new Date(endDate).toISOString();
      if (limit) filters.limit = limit;

      const data = await reportsMapService.getReportsMapData(filters);
      setReportsData(data);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }, [province, district, subdistrict, reportType, startDate, endDate, limit]);

  // โหลดข้อมูลครั้งแรก
  useEffect(() => {
    handleSearch();
  }, []);

  // ล้างข้อมูล
  const handleClear = () => {
    setReportType("");
    setZone("");
    setProvince("");
    setDistrict("");
    setSubdistrict("");
    setStartDate("");
    setEndDate("");
    setLimit(5000);
  };

  // เตรียมข้อมูลสำหรับแผนที่
  const mapCustomOptions = useMemo(() => {
    if (!reportsData || !reportsData.reports) return {};

    // นับจำนวนรายงานต่อจังหวัด
    const provinceCounts = {};
    reportsData.reports.forEach((report) => {
      const provinceName = report.province_name_th;
      if (provinceName) {
        provinceCounts[provinceName] = (provinceCounts[provinceName] || 0) + 1;
      }
    });

    return {
      tooltip: {
        formatter: function () {
          if (this.point && this.point.name) {
            const count = provinceCounts[this.point.name] || 0;
            return `
              <div style="padding: 8px;">
                <b>${this.point.name}</b><br/>
                จำนวนรายงาน: <b>${count.toLocaleString()}</b> รายงาน
              </div>
            `;
          }
          return false;
        },
        useHTML: true,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#7e32e2",
        borderRadius: 8,
        borderWidth: 1,
        shadow: true,
      },
      colorAxis: {
        min: 0,
        minColor: "#E0E0E0",
        maxColor: "#7e32e2",
      },
      plotOptions: {
        map: {
          dataLabels: {
            enabled: false,
          },
        },
      },
    };
  }, [reportsData]);

  return (
    <div className="max-w-full mb-8">
      {/* Header */}
      <div className="relative mb-6 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7e32e2] via-[#9333ea] to-[#a855f7]" />
        <div className="absolute inset-0 bg-white/5" />
        <div className="relative p-6 sm:p-8">
          <div className="text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <MapPin size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  รายงานทั้งหมดบนแผนที่
                </h1>
                <p className="text-white/80">
                  แสดงข้อมูลรายงาน 7 ประเภทพร้อมพิกัดบนแผนที่ประเทศไทย
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white via-purple-50/30 to-white rounded-3xl shadow-xl border border-purple-100/50 p-6 md:p-8">
        {/* ฟอร์มค้นหา */}
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-purple-600" />
            <label className="font-bold text-purple-600 text-base">
              ตัวกรองข้อมูล
            </label>
          </div>

          {/* ประเภทรายงาน */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <CustomSelect
              label="ประเภทรายงาน"
              options={REPORT_TYPES}
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              placeholder="เลือกประเภทรายงาน"
              icon={FileText}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จำนวนรายงานสูงสุด
              </label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                min="100"
                max="50000"
                step="100"
                className="w-full px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#7e32e2]"
              />
            </div>
          </div>

          {/* พื้นที่ */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <CustomSelect
              label="เขตสุขภาพ"
              options={ZONES}
              value={zone}
              onChange={(e) => {
                setZone(e.target.value);
                setProvince("");
                setDistrict("");
                setSubdistrict("");
              }}
              placeholder="เลือกเขตสุขภาพ"
              icon={MapPin}
            />
            <CustomSelect
              label="จังหวัด"
              options={provinceOptions}
              value={province}
              onChange={(e) => {
                setProvince(e.target.value);
                setDistrict("");
                setSubdistrict("");
              }}
              placeholder="เลือกจังหวัด"
              icon={MapPin}
              disabled={!zone}
            />
            <CustomSelect
              label="อำเภอ"
              options={districtOptions}
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setSubdistrict("");
              }}
              placeholder="เลือกอำเภอ"
              icon={MapPin}
              disabled={!province}
            />
            <CustomSelect
              label="ตำบล"
              options={subdistrictOptions}
              value={subdistrict}
              onChange={(e) => setSubdistrict(e.target.value)}
              placeholder="เลือกตำบล"
              icon={MapPin}
              disabled={!district}
            />
          </div>

          {/* ช่วงเวลา */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันที่เริ่มต้น
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#7e32e2]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#7e32e2]"
              />
            </div>
          </div>

          {/* ปุ่มค้นหา/ล้าง */}
          <div className="flex flex-col md:flex-row gap-3">
            <ButtonService
              type="button"
              variant="primary"
              className="w-full md:w-fit flex-1 h-12 text-[18px] bg-[#7e32e2] hover:bg-[#6c28c8] border-none shadow-none text-white"
              onClick={handleSearch}
              icon={<Search className="w-5 h-5 mr-2 text-white" />}
              disabled={loading}
            >
              {loading ? "กำลังค้นหา..." : "ค้นหา"}
            </ButtonService>
            <ButtonService
              type="button"
              variant="secondary"
              className="w-full md:w-fit flex-1 h-12 text-[18px] bg-white border border-[#7e32e2] text-[#7e32e2] hover:bg-[#f6eeff] shadow-none"
              onClick={handleClear}
            >
              ล้างข้อมูล
            </ButtonService>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* สรุปข้อมูล */}
        {reportsData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
            {/* รวมทั้งหมด */}
            <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl shadow-md border border-purple-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  รวมทั้งหมด
                </span>
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                {reportsData.total_reports.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 mt-1">รายงาน</div>
            </div>

            {/* รายประเภท (แสดง 3 ประเภทที่มีมากที่สุด) */}
            {Object.entries(reportsData.summary_by_type)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([type, count]) => {
                const reportTypeInfo = REPORT_TYPES.find((r) => r.value === type);
                return (
                  <div
                    key={type}
                    className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl shadow-md border border-purple-100 p-5"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="rounded-xl p-3 shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${REPORT_COLORS[type]}, ${REPORT_COLORS[type]}dd)`,
                        }}
                      >
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 line-clamp-2">
                        {reportTypeInfo?.label || type}
                      </span>
                    </div>
                    <div
                      className="text-3xl font-bold"
                      style={{ color: REPORT_COLORS[type] }}
                    >
                      {count.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">รายงาน</div>
                  </div>
                );
              })}
          </div>
        )}

        {/* แผนที่ */}
        <div className="bg-gradient-to-br from-white to-purple-50/20 rounded-2xl shadow-lg border border-purple-100 p-6">
          <div className="font-bold text-purple-600 text-lg mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            แผนที่แสดงตำแหน่งรายงาน
          </div>
          <div style={{ minHeight: 600 }}>
            {loading ? (
              <div className="flex items-center justify-center h-[600px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
                </div>
              </div>
            ) : (
              <MapThailandComponent
                height={600}
                customOptions={mapCustomOptions}
                className="w-full h-full"
              />
            )}
          </div>
        </div>

        {/* สรุปตามประเภทรายงาน */}
        {reportsData && reportsData.summary_by_type && (
          <div className="bg-gradient-to-br from-white to-purple-50/20 rounded-2xl shadow-lg border border-purple-100 p-6 mt-6">
            <div className="font-bold text-purple-600 text-lg mb-4 flex items-center gap-2">
              <BarChart2 className="w-5 h-5" />
              สรุปตามประเภทรายงาน
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.entries(reportsData.summary_by_type).map(([type, count]) => {
                const reportTypeInfo = REPORT_TYPES.find((r) => r.value === type);
                return (
                  <div
                    key={type}
                    className="flex items-center gap-3 bg-white rounded-xl p-4 border border-purple-100 hover:shadow-md transition-shadow"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: REPORT_COLORS[type] }}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-700">
                        {reportTypeInfo?.label || type}
                      </div>
                      <div
                        className="text-lg font-bold"
                        style={{ color: REPORT_COLORS[type] }}
                      >
                        {count.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsMapView;

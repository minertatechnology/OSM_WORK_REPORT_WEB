import React, { useState } from "react";
import InputService from "@services/inputService/inputService";
import ButtonService from "@services/buttonService/buttonService";

// ปี options (mock)
const YEARS = [
  { label: "2568", value: "2568" },
  { label: "2567", value: "2567" },
  { label: "2566", value: "2566" },
];

// เดือน options (mock)
const MONTHS = [
  { label: "มกราคม", value: "01" },
  { label: "กุมภาพันธ์", value: "02" },
  { label: "มีนาคม", value: "03" },
  { label: "เมษายน", value: "04" },
  { label: "พฤษภาคม", value: "05" },
  { label: "มิถุนายน", value: "06" },
  { label: "กรกฎาคม", value: "07" },
  { label: "สิงหาคม", value: "08" },
  { label: "กันยายน", value: "09" },
  { label: "ตุลาคม", value: "10" },
  { label: "พฤศจิกายน", value: "11" },
  { label: "ธันวาคม", value: "12" },
];

// สำหรับ week
const WEEKS = [
  { label: "สัปดาห์ 1 (2/6/68-8/6/68)", value: "week1" },
  { label: "สัปดาห์ 2 (9/6/68-15/6/68)", value: "week2" },
  { label: "สัปดาห์ 3 (16/6/68-22/6/68)", value: "week3" },
  { label: "สัปดาห์ 4 (23/6/68-27/6/68)", value: "week4" },
];

// เขตสุขภาพ mock
const ZONES = [
  { label: "ทั้งหมด", value: "" },
  { label: "เขตสุขภาพที่ 1", value: "zone1" },
  { label: "เขตสุขภาพที่ 2", value: "zone2" },
  { label: "เขตสุขภาพที่ 3", value: "zone3" },
  { label: "เขตสุขภาพที่ 4", value: "zone4" },
];

// จังหวัด/อำเภอ/ตำบล - mock
const PROVINCES = [
  { label: "เลือกจังหวัด", value: "" },
  { label: "นนทบุรี", value: "นนทบุรี" },
  { label: "ปทุมธานี", value: "ปทุมธานี" },
];
const DISTRICTS = [
  { label: "เลือกอำเภอ", value: "" },
  { label: "เมือง", value: "เมือง" },
  { label: "คลองหลวง", value: "คลองหลวง" },
];
const SUBDISTRICTS = [
  { label: "เลือกตำบล", value: "" },
  { label: "บางกระสอ", value: "บางกระสอ" },
  { label: "ตลาดขวัญ", value: "ตลาดขวัญ" },
];

const DashboardSobos = () => {
  const [searchType, setSearchType] = useState("year");

  // ปี/เดือน/สัปดาห์แบบ option
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [week, setWeek] = useState("");

  const [zone, setZone] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [subdistrict, setSubdistrict] = useState("");

  // ล้างข้อมูลการค้นหา
  const handleClear = () => {
    setYear("");
    setMonth("");
    setWeek("");
    setZone("");
    setProvince("");
    setDistrict("");
    setSubdistrict("");
  };

  // กดค้นหา
  const handleSearch = () => {
    // TODO: ประมวลผลการค้นหา
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4 md:p-6 max-w-full mb-8">
      <div className="flex flex-col gap-4">
        {/* รูปแบบการค้นหา */}
        <div className="flex flex-wrap gap-x-6 gap-y-3 items-center">
          <label className="font-semibold text-[#231d37] text-[15.5px]">
            รูปแบบการค้นหา :
          </label>
          <div className="flex gap-3 items-center">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                className="hidden peer"
                checked={searchType === "year"}
                onChange={() => setSearchType("year")}
              />
              <span
                className={`w-5 h-5 mr-2 rounded-full border-2 flex items-center justify-center transition-colors ${
                  searchType === "year"
                    ? "border-[#7e32e2] bg-[#f6eeff]"
                    : "border-gray-300 bg-white"
                }`}
              >
                {searchType === "year" && (
                  <span className="w-3 h-3 bg-[#7e32e2] rounded-full block" />
                )}
              </span>
              <span
                className={`font-medium ${
                  searchType === "year" ? "text-[#7e32e2]" : "text-[#aaa]"
                }`}
              >
                ค้นหาแบบรายปี
              </span>
            </label>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                className="hidden peer"
                checked={searchType === "budget"}
                onChange={() => setSearchType("budget")}
              />
              <span
                className={`w-5 h-5 mr-2 rounded-full border-2 flex items-center justify-center transition-colors ${
                  searchType === "budget"
                    ? "border-[#7e32e2] bg-[#f6eeff]"
                    : "border-gray-300 bg-white"
                }`}
              >
                {searchType === "budget" && (
                  <span className="w-3 h-3 bg-[#7e32e2] rounded-full block" />
                )}
              </span>
              <span
                className={`font-medium ${
                  searchType === "budget" ? "text-[#7e32e2]" : "text-[#aaa]"
                }`}
              >
                ค้นหาแบบรายปีงบประมาณ
              </span>
            </label>
          </div>
        </div>

        {/* ฟิลด์ ปี / เดือน / สัปดาห์ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-[14px] text-[#222] font-medium mb-1">ปี</div>
            <InputService
              options={YEARS}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="เลือกปี"
              name="year"
            />
          </div>
          <div>
            <div className="text-[14px] text-[#222] font-medium mb-1">
              เดือน
            </div>
            <InputService
              options={MONTHS}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              placeholder="เลือกเดือน"
              name="month"
            />
          </div>
          <div>
            <div className="text-[14px] text-[#222] font-medium mb-1">
              สัปดาห์
            </div>
            <InputService
              options={WEEKS}
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              placeholder="เลือกสัปดาห์"
              name="week"
            />
          </div>
        </div>

        {/* ฟิลด์ เขตสุขภาพ จังหวัด อำเภอ ตำบล */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
          <div>
            <div className="text-[14px] text-[#222] font-medium mb-1">
              เขตสุขภาพ
            </div>
            <InputService
              options={ZONES}
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="เลือกเขตสุขภาพ"
              name="zone"
            />
          </div>
          <div>
            <div className="text-[14px] text-[#222] font-medium mb-1">
              จังหวัด
            </div>
            <InputService
              options={PROVINCES}
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              placeholder="เลือกจังหวัด"
              name="province"
            />
          </div>
          <div>
            <div className="text-[14px] text-[#222] font-medium mb-1">
              อำเภอ
            </div>
            <InputService
              options={DISTRICTS}
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="เลือกอำเภอ"
              name="district"
            />
          </div>
          <div>
            <div className="text-[14px] text-[#222] font-medium mb-1">ตำบล</div>
            <InputService
              options={SUBDISTRICTS}
              value={subdistrict}
              onChange={(e) => setSubdistrict(e.target.value)}
              placeholder="เลือกตำบล"
              name="subdistrict"
            />
          </div>
        </div>

        {/* ปุ่มค้นหา/ล้าง */}
        <div className="flex flex-col md:flex-row gap-3 mt-2">
          <ButtonService
            type="button"
            color="primary"
            className="w-full md:w-fit flex-1 h-12 text-[18px]"
            onClick={handleSearch}
            iconLeft="search"
          >
            ค้นหา
          </ButtonService>
          <ButtonService
            type="button"
            color="outline"
            className="w-full md:w-fit flex-1 h-12 text-[18px]"
            onClick={handleClear}
          >
            ล้างข้อมูลการค้นหา
          </ButtonService>
        </div>
      </div>
    </div>
  );
};

export default DashboardSobos;

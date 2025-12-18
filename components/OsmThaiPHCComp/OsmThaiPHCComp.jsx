import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import {
  Search,
  Eye,
  EyeOff,
  Download,
  ChevronDown,
  Calendar,
  MapPin,
  X,
} from "lucide-react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import ButtonService from "@services/buttonService/buttonService";
import CustomSelect from "@services/customSelectService/customSelectService";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { font as SarabunFont } from "@styles/Sarabun-Regular-normal";
import { fontbold as SarabunBoldFont } from "@styles/Sarabun-Regular-bold";

// Register chart.js elements
ChartJS.register(ArcElement, Tooltip, Legend);

// Mock Data
const YEARS = [
  { label: "2568", value: "2568" },
  { label: "2567", value: "2567" },
  { label: "2566", value: "2566" },
];
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
const ZONES = [
  { label: "เลือกเขตสุขภาพ", value: "" },
  ...Array.from({ length: 13 }, (_, i) => ({
    label: `เขตสุขภาพที่ ${i + 1}`,
    value: `${i + 1}`,
  })),
];
const PROVINCES = [
  { label: "เลือกจังหวัด", value: "" },
  { label: "เชียงใหม่", value: "เชียงใหม่" },
  { label: "กรุงเทพฯ", value: "กรุงเทพฯ" },
];
const DISTRICTS = [
  { label: "เลือกอำเภอ", value: "" },
  { label: "เมือง", value: "เมือง" },
  { label: "สันทราย", value: "สันทราย" },
];
const SUBDISTRICTS = [
  { label: "เลือกตำบล", value: "" },
  { label: "ท่าศาลา", value: "ท่าศาลา" },
  { label: "หนองจ๊อม", value: "หนองจ๊อม" },
];

// ข้อมูลเมื่อเลือกจังหวัด (Pie chart + รายละเอียด)
const provincePieData = [
  {
    color: "#1ac6ae",
    value: 7835,
    label: "จำนวน อสม.ตามโควตาที่จังหวัดได้รับ",
    icon: (
      <span
        className="w-6 h-6 rounded-lg flex items-center justify-center"
        style={{ background: "#1ac6ae" }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20">
          <rect x="2" y="2" width="16" height="16" rx="4" fill="#1ac6ae" />
          <path
            d="M6 10h8"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M10 6v8"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
    ),
    textColor: "#1ac6ae",
  },
  {
    color: "#8a61e5",
    value: 8974,
    label: "จำนวน อสม. ที่มีอยู่ ณ ปัจจุบัน",
    icon: (
      <span
        className="w-6 h-6 rounded-lg flex items-center justify-center"
        style={{ background: "#8a61e5" }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20">
          <rect x="2" y="2" width="16" height="16" rx="4" fill="#8a61e5" />
          <path
            d="M10 6v8"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
    ),
    textColor: "#8a61e5",
  },
  {
    color: "#f5873d",
    value: -1139,
    label: "จำนวน อสม. ที่สามารถเพิ่มได้ตามโควตา",
    icon: (
      <span
        className="w-6 h-6 rounded-lg flex items-center justify-center"
        style={{ background: "#f5873d" }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20">
          <rect x="2" y="2" width="16" height="16" rx="4" fill="#f5873d" />
          <path
            d="M14 10H6"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
    ),
    textColor: "#f5873d",
  },
];
const provincePieChartData = {
  labels: provincePieData.map((d) => d.label),
  datasets: [
    {
      data: provincePieData.map((d) => d.value),
      backgroundColor: provincePieData.map((d) => d.color),
      borderWidth: 2,
      borderColor: "#fff",
    },
  ],
};
const provincePieChartOptions = {
  cutout: "70%",
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: function (context) {
          const label = context.label || "";
          const value = context.raw || 0;
          return `${label}: ${value.toLocaleString()} คน`;
        },
      },
    },
  },
};

const provincePieSummary = provincePieData;

// Legend options (เดิม)
const LEGEND_OPTIONS = [
  {
    label: (
      <span className="flex items-center gap-2">
        <span
          className="w-4 h-4 rounded-full inline-block"
          style={{ background: "#47d2be" }}
        />
        จำนวน อสม.จากฐานข้อมูล ThaiPHC และกรมบัญชีกลาง
      </span>
    ),
    value: "phc-central",
    text: "จำนวน อสม.จากฐานข้อมูล ThaiPHC และกรมบัญชีกลาง",
  },
  {
    label: (
      <span className="flex items-center gap-2">
        <span
          className="w-4 h-4 rounded-full inline-block"
          style={{ background: "#7ec3fa" }}
        />
        จำนวน อสม.จากฐานข้อมูลกรมบัญชีกลาง ที่ไม่มีข้อมูลใน Thaiphc
      </span>
    ),
    value: "central-no-phc",
    text: "จำนวน อสม.จากฐานข้อมูลกรมบัญชีกลาง ที่ไม่มีข้อมูลใน Thaiphc",
  },
  {
    label: (
      <span className="flex items-center gap-2">
        <span
          className="w-4 h-4 rounded-full inline-block"
          style={{ background: "#2991e8" }}
        />
        จำนวน อสม.รายใหม่ที่รอยืนยันจากสสจ.
      </span>
    ),
    value: "new-osm",
    text: "จำนวน อสม.รายใหม่ที่รอยืนยันจากสสจ.",
  },
  {
    label: (
      <span className="flex items-center gap-2">
        <span
          className="w-4 h-4 rounded-full inline-block"
          style={{ background: "#b0a9c5" }}
        />
        จำนวน อสม.ที่ไม่มีข้อมูลในฐานข้อมูลกรมบัญชีกลาง
      </span>
    ),
    value: "no-central",
    text: "จำนวน อสม.ที่ไม่มีข้อมูลในฐานข้อมูลกรมบัญชีกลาง",
  },
  {
    label: (
      <span className="flex items-center gap-2">
        <span
          className="w-4 h-4 rounded-full inline-block"
          style={{ background: "#888" }}
        />
        จำนวน อสม. จาก ThaiPHC ที่ไม่เข้าเงื่อนไข
      </span>
    ),
    value: "phc-not-match",
    text: "จำนวน อสม. จาก ThaiPHC ที่ไม่เข้าเงื่อนไข",
  },
];

// Helper function to get category text from value
const getCategoryText = (categoryValue) => {
  const option = LEGEND_OPTIONS.find((opt) => opt.value === categoryValue);
  return option ? option.text : "";
};

// Pie chart mock values (สีให้ตรง legend)
const pieData = [
  {
    color: "#47d2be",
    value: 8974,
    label: "รายชื่อ อสม.แยกตามแหล่งที่มา ของข้อมูล",
    textColor: "#1ac6ae",
  },
  {
    color: "#417af7",
    value: 2,
    label: "จำนวน อสม.จากฐานข้อมูล กรมบัญชีกลาง ที่ไม่มีข้อมูลใน Thaiphc",
    textColor: "#417af7",
  },
  {
    color: "#00b2ea",
    value: 4,
    label: "จำนวน อสม.รายใหม่ที่รอยืนยันจากสสจ.",
    textColor: "#00b2ea",
  },
  {
    color: "#b686f0",
    value: 475,
    label: "จำนวน อสม.ที่ไม่มีข้อมูลในฐานข้อมูลกรมบัญชีกลาง",
    textColor: "#b686f0",
  },
  {
    color: "#7e32e2",
    value: 88,
    label: "อสม. ขอรับค่าป่วยการ",
    textColor: "#7e32e2",
  },
  {
    color: "#8f48ce",
    value: 39,
    label: "อสม. ไม่ขอรับค่าป่วยการ",
    textColor: "#8f48ce",
  },
  {
    color: "#c799f7",
    value: 348,
    label: "อสม. รอรับค่าป่วยการ",
    textColor: "#c799f7",
  },
];

const pieDataSummary = pieData.slice(0, 3); // 3 ก้อนแรกแสดงใต้กราฟ

const pieChartData = {
  labels: pieData.map((d) => d.label),
  datasets: [
    {
      data: pieData.map((d) => d.value),
      backgroundColor: pieData.map((d) => d.color),
      borderWidth: 2,
      borderColor: "#fff",
    },
  ],
};
const pieChartOptions = {
  cutout: "70%",
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: function (context) {
          const label = context.label || "";
          const value = context.raw || 0;
          return `${label}: ${value.toLocaleString()} คน`;
        },
      },
    },
  },
};

const mockUserDetails = [
  {
    prefix: "นางสาว",
    firstName: "ชนุชนาถ",
    lastName: "ผดุงจิตร",
    cid: "1709900273968",
    gender: "หญิง",
    bloodType: "O",
    maritalStatus: "โสด",
    children: "-",
    phone: "081-234-5678",
    email: "chanuchanart@email.com",
    education: "ปริญญาตรี",
    birthDate: "24/02/2530",
    occupation: "เกษตรกรรม",
    houseNumber: "17",
    villageNumber: "2",
    postalCode: "76130",
    province: "เพชรบุรี",
    district: "อำเภอท่ายาง",
    subdistrict: "หนองจอก",
    village: "บ้านหนองจอก",
    hospitalCode: "76050402",
    motto: "ใจดีมีน้ำใจ",
    osmCardNumber: "76050402011031",
    osmStartDate: "15/03/2562",
    osmYear: "2562",
    osmStatus: "ปกติ",
    paymentStatus: "ขอรับค่าป่วยการ",
    bank: "ธนาคารกรุงไทย",
    accountNumber: "123-4-56789-0",
    hasSmartphone: "มี",
    category: "phc-central", // จำนวน อสม.จากฐานข้อมูล ThaiPHC และกรมบัญชีกลาง
  },
  {
    prefix: "นาย",
    firstName: "สมชาย",
    lastName: "ใจดี",
    cid: "1234567890123",
    gender: "ชาย",
    bloodType: "A",
    maritalStatus: "สมรส",
    children: "2",
    phone: "082-345-6789",
    email: "-",
    education: "มัธยมศึกษาตอนปลาย",
    birthDate: "10/05/2518",
    occupation: "รับจ้างทั่วไป",
    houseNumber: "25",
    villageNumber: "3",
    postalCode: "50000",
    province: "เชียงใหม่",
    district: "อำเภอเมือง",
    subdistrict: "ช้างเผือก",
    village: "บ้านช้างเผือก",
    hospitalCode: "50010301",
    motto: "ช่วยเหลือผู้อื่น",
    osmCardNumber: "50010301012045",
    osmStartDate: "01/01/2561",
    osmYear: "2561",
    osmStatus: "ปกติ",
    paymentStatus: "ขอรับค่าป่วยการ",
    bank: "ธนาคารกสิกรไทย",
    accountNumber: "234-5-67890-1",
    hasSmartphone: "มี",
    category: "phc-central", // จำนวน อสม.จากฐานข้อมูล ThaiPHC และกรมบัญชีกลาง
  },
  {
    prefix: "นาง",
    firstName: "สมหญิง",
    lastName: "รักษาดี",
    cid: "2345678901234",
    gender: "หญิง",
    bloodType: "B",
    maritalStatus: "สมรส",
    children: "3",
    phone: "083-456-7890",
    email: "somying@email.com",
    education: "มัธยมศึกษาตอนต้น",
    birthDate: "20/08/2523",
    occupation: "ค้าขาย",
    houseNumber: "42",
    villageNumber: "5",
    postalCode: "10110",
    province: "กรุงเทพฯ",
    district: "เขตบางกอกน้อย",
    subdistrict: "บางขุนนนท์",
    village: "บ้านบางขุนนนท์",
    hospitalCode: "10010203",
    motto: "บริการด้วยใจ",
    osmCardNumber: "10010203015067",
    osmStartDate: "20/06/2560",
    osmYear: "2560",
    osmStatus: "ปกติ",
    paymentStatus: "ขอรับค่าป่วยการ",
    bank: "ธนาคารไทยพาณิชย์",
    accountNumber: "345-6-78901-2",
    hasSmartphone: "มี",
    category: "phc-central", // จำนวน อสม.จากฐานข้อมูล ThaiPHC และกรมบัญชีกลาง
  },
  {
    prefix: "นางสาว",
    firstName: "มาลี",
    lastName: "ดอกไม้",
    cid: "3456789012345",
    gender: "หญิง",
    bloodType: "AB",
    maritalStatus: "โสด",
    children: "-",
    phone: "084-567-8901",
    email: "-",
    education: "ปริญญาตรี",
    birthDate: "15/12/2533",
    occupation: "พนักงานบริษัท",
    houseNumber: "88",
    villageNumber: "1",
    postalCode: "80000",
    province: "นครศรีธรรมราช",
    district: "อำเภอเมือง",
    subdistrict: "ในเมือง",
    village: "บ้านในเมือง",
    hospitalCode: "80010101",
    motto: "-",
    osmCardNumber: "80010101011089",
    osmStartDate: "10/09/2563",
    osmYear: "2563",
    osmStatus: "ปกติ",
    paymentStatus: "ไม่ขอรับค่าป่วยการ",
    bank: "-",
    accountNumber: "-",
    hasSmartphone: "มี",
    category: "central-no-phc", // จำนวน อสม.จากฐานข้อมูลกรมบัญชีกลาง ที่ไม่มีข้อมูลใน Thaiphc
  },
  {
    prefix: "นาย",
    firstName: "ประสิทธิ์",
    lastName: "สุขสันต์",
    cid: "4567890123456",
    gender: "ชาย",
    bloodType: "O",
    maritalStatus: "สมรส",
    children: "1",
    phone: "085-678-9012",
    email: "prasit@email.com",
    education: "ปริญญาโท",
    birthDate: "05/03/2525",
    occupation: "ข้าราชการบำนาญ",
    houseNumber: "12",
    villageNumber: "7",
    postalCode: "40000",
    province: "ขอนแก่น",
    district: "อำเภอเมือง",
    subdistrict: "ในเมือง",
    village: "บ้านกลางเมือง",
    hospitalCode: "40010102",
    motto: "สุขภาพดีคือความสุข",
    osmCardNumber: "40010102017123",
    osmStartDate: "01/04/2559",
    osmYear: "2559",
    osmStatus: "ปกติ",
    paymentStatus: "ขอรับค่าป่วยการ",
    bank: "ธนาคารกรุงเทพ",
    accountNumber: "456-7-89012-3",
    hasSmartphone: "มี",
    category: "new-osm", // จำนวน อสม.รายใหม่ที่รอยืนยันจากสสจ.
  },
  {
    prefix: "นาง",
    firstName: "วิไล",
    lastName: "อุไรพร",
    cid: "5678901234567",
    gender: "หญิง",
    bloodType: "A",
    maritalStatus: "หม้าย",
    children: "4",
    phone: "086-789-0123",
    email: "-",
    education: "ประถมศึกษา",
    birthDate: "30/11/2508",
    occupation: "เกษตรกรรม",
    houseNumber: "56",
    villageNumber: "4",
    postalCode: "30000",
    province: "นครราชสีมา",
    district: "อำเภอปากช่อง",
    subdistrict: "ปากช่อง",
    village: "บ้านปากช่อง",
    hospitalCode: "30040201",
    motto: "ช่วยเหลือชุมชน",
    osmCardNumber: "30040201014156",
    osmStartDate: "18/02/2558",
    osmYear: "2558",
    osmStatus: "ปกติ",
    paymentStatus: "ขอรับค่าป่วยการ",
    bank: "ธนาคารกรุงไทย",
    accountNumber: "567-8-90123-4",
    hasSmartphone: "ไม่มี",
    category: "no-central", // จำนวน อสม.ที่ไม่มีข้อมูลในฐานข้อมูลกรมบัญชีกลาง
  },
  {
    prefix: "นาย",
    firstName: "อนันต์",
    lastName: "ศรีสุข",
    cid: "6789012345678",
    gender: "ชาย",
    bloodType: "B",
    maritalStatus: "สมรส",
    children: "2",
    phone: "087-890-1234",
    email: "anan@email.com",
    education: "ปริญญาตรี",
    birthDate: "22/07/2520",
    occupation: "ธุรกิจส่วนตัว",
    houseNumber: "99",
    villageNumber: "6",
    postalCode: "20000",
    province: "ชลบุรี",
    district: "อำเภอเมือง",
    subdistrict: "บางปลาสร้อย",
    village: "บ้านบางปลาสร้อย",
    hospitalCode: "20010301",
    motto: "มุ่งมั่นพัฒนา",
    osmCardNumber: "20010301016234",
    osmStartDate: "25/05/2561",
    osmYear: "2561",
    osmStatus: "ปกติ",
    paymentStatus: "ขอรับค่าป่วยการ",
    bank: "ธนาคารกสิกรไทย",
    accountNumber: "678-9-01234-5",
    hasSmartphone: "มี",
    category: "phc-not-match", // จำนวน อสม. จาก ThaiPHC ที่ไม่เข้าเงื่อนไข
  },
  {
    prefix: "นางสาว",
    firstName: "กมลชนก",
    lastName: "สวัสดิ์",
    cid: "7890123456789",
    gender: "หญิง",
    bloodType: "O",
    maritalStatus: "โสด",
    children: "-",
    phone: "088-901-2345",
    email: "kamonchonok@email.com",
    education: "ปริญญาตรี",
    birthDate: "08/09/2535",
    occupation: "ครู",
    houseNumber: "33",
    villageNumber: "8",
    postalCode: "60000",
    province: "นครสวรรค์",
    district: "อำเภอเมือง",
    subdistrict: "ปากน้ำโพ",
    village: "บ้านปากน้ำโพ",
    hospitalCode: "60010401",
    motto: "การศึกษาคือรากฐาน",
    osmCardNumber: "60010401018345",
    osmStartDate: "12/08/2564",
    osmYear: "2564",
    osmStatus: "ปกติ",
    paymentStatus: "ขอรับค่าป่วยการ",
    bank: "ธนาคารไทยพาณิชย์",
    accountNumber: "789-0-12345-6",
    hasSmartphone: "มี",
    category: "new-osm", // จำนวน อสม.รายใหม่ที่รอยืนยันจากสสจ.
  },
  {
    prefix: "นาย",
    firstName: "วิชัย",
    lastName: "พูลสวัสดิ์",
    cid: "8901234567890",
    gender: "ชาย",
    bloodType: "AB",
    maritalStatus: "สมรส",
    children: "5",
    phone: "089-012-3456",
    email: "-",
    education: "มัธยมศึกษาตอนปลาย",
    birthDate: "17/01/2515",
    occupation: "รับจ้าง",
    houseNumber: "74",
    villageNumber: "9",
    postalCode: "70000",
    province: "ราชบุรี",
    district: "อำเภอเมือง",
    subdistrict: "หน้าเมือง",
    village: "บ้านหน้าเมือง",
    hospitalCode: "70010201",
    motto: "-",
    osmCardNumber: "70010201019456",
    osmStartDate: "05/07/2557",
    osmYear: "2557",
    osmStatus: "ปกติ",
    paymentStatus: "ขอรับค่าป่วยการ",
    bank: "ธนาคารกรุงไทย",
    accountNumber: "890-1-23456-7",
    hasSmartphone: "ไม่มี",
    category: "no-central", // จำนวน อสม.ที่ไม่มีข้อมูลในฐานข้อมูลกรมบัญชีกลาง
  },
  {
    prefix: "นาง",
    firstName: "อรุณี",
    lastName: "แสงจันทร์",
    cid: "9012345678901",
    gender: "หญิง",
    bloodType: "A",
    maritalStatus: "สมรส",
    children: "3",
    phone: "090-123-4567",
    email: "arunee@email.com",
    education: "ปริญญาตรี",
    birthDate: "28/04/2522",
    occupation: "พยาบาล",
    houseNumber: "61",
    villageNumber: "10",
    postalCode: "90000",
    province: "สงขลา",
    district: "อำเภอเมือง",
    subdistrict: "บ่อยาง",
    village: "บ้านบ่อยาง",
    hospitalCode: "90010501",
    motto: "รักษาด้วยหัวใจ",
    osmCardNumber: "90010501010567",
    osmStartDate: "30/11/2562",
    osmYear: "2562",
    osmStatus: "ปกติ",
    paymentStatus: "ขอรับค่าป่วยการ",
    bank: "ธนาคารกสิกรไทย",
    accountNumber: "901-2-34567-8",
    hasSmartphone: "มี",
    category: "central-no-phc", // จำนวน อสม.จากฐานข้อมูลกรมบัญชีกลาง ที่ไม่มีข้อมูลใน Thaiphc
  },
  {
    prefix: "นาย",
    firstName: "สุรชัย",
    lastName: "บุญมี",
    cid: "1539900551382",
    gender: "ชาย",
    bloodType: "B",
    maritalStatus: "สมรส",
    children: "1",
    phone: "091-234-5678",
    email: "-",
    education: "ปริญญาตรี",
    birthDate: "12/06/2528",
    occupation: "ข้าราชการ",
    houseNumber: "45",
    villageNumber: "11",
    postalCode: "83000",
    province: "ภูเก็ต",
    district: "อำเภอเมือง",
    subdistrict: "ตลาดใหญ่",
    village: "บ้านตลาดใหญ่",
    hospitalCode: "83010102",
    motto: "ทำดีได้ดี",
    osmCardNumber: "83010102011678",
    osmStartDate: "22/10/2563",
    osmYear: "2563",
    osmStatus: "ปกติ",
    paymentStatus: "ขอรับค่าป่วยการ",
    bank: "ธนาคารกรุงเทพ",
    accountNumber: "012-3-45678-9",
    hasSmartphone: "มี",
    category: "phc-central", // จำนวน อสม.จากฐานข้อมูล ThaiPHC และกรมบัญชีกลาง
  },
];

// Function to mask CID for PDPA compliance
// Mask last 4 digits for both table and modal (9 ตัวแรก + X 4 ตัว)
const maskCID = (cid, showFull = false, isTable = false) => {
  if (!cid) return "-";
  const cleanCID = cid.replace(/[^0-9]/g, "");
  if (cleanCID.length !== 13) return cid;

  if (showFull) {
    // Show full CID in standard format
    return `${cleanCID.slice(0, 1)}-${cleanCID.slice(1, 5)}-${cleanCID.slice(
      5,
      10
    )}-${cleanCID.slice(10, 12)}-${cleanCID.slice(12, 13)}`;
  }

  // For both table and modal: mask only last 4 digits (9 ตัวแรก + X 4 ตัว)
  return `${cleanCID.slice(0, 1)}-${cleanCID.slice(1, 5)}-${cleanCID.slice(
    5,
    9
  )}-XX-XX`;
};

const showProvinceChart = (province) => province && province !== "";

// Detail Modal Component
function OsmDetailModal({ open, onClose, data }) {
  const [showFullCID, setShowFullCID] = useState(false);

  if (!open || !data) return null;

  const handleToggleCID = async () => {
    if (!showFullCID) {
      // Show PDPA warning before revealing full ID using SweetAlert2
      const result = await Swal.fire({
        title: "คำเตือนตามกฎหมาย PDPA",
        html: `
          <div style="text-align: left; padding: 10px;">
            <p style="margin-bottom: 15px; font-weight: 600; color: #7e32e2;">
              ⚠️ พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
            </p>
            <p style="margin-bottom: 12px; line-height: 1.6;">
              การเปิดเผยข้อมูลส่วนบุคคล เช่น <strong>เลขบัตรประจำตัวประชาชน</strong> ต้องมีวัตถุประสงค์ที่ชอบด้วยกฎหมาย และได้รับความยินยอมจากเจ้าของข้อมูล
            </p>
            <p style="margin-bottom: 12px; line-height: 1.6;">
              การเข้าถึงข้อมูลนี้อาจถูกบันทึกไว้เพื่อการตรวจสอบ
            </p>
            <p style="margin-top: 15px; font-weight: 500; color: #555;">
              คุณต้องการดูเลขบัตรประจำตัวประชาชนแบบเต็มหรือไม่?
            </p>
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#7e32e2",
        cancelButtonColor: "#888",
        confirmButtonText: "ยืนยัน",
        cancelButtonText: "ยกเลิก",
        customClass: {
          popup: "rounded-2xl",
          title: "text-xl font-bold",
          htmlContainer: "text-base",
        },
        focusConfirm: false,
      });

      if (result.isConfirmed) {
        setShowFullCID(true);
      }
    } else {
      setShowFullCID(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#ece1f7] w-full max-w-4xl relative my-8 flex flex-col max-h-[90vh]">
        {/* Fixed Header */}
        <div className="p-7 pb-4 border-b border-purple-200">
          <div className="text-[22px] font-bold text-[#7e32e2] mb-2">
            รายละเอียด
          </div>
          <div className="text-[14px] text-gray-600">
            (ข้อมูลจาก จำนวน อสม.จากฐานข้อมูล ThaiPHC และกรมบัญชีกลาง)
          </div>
          <button
            className="absolute top-4 right-4 text-[#aaa] hover:text-[#e74c3c] transition"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-7 pt-4 flex-1">
          {/* ข้อมูลส่วนตัว */}
          <div className="mb-6">
            <div className="text-[18px] font-bold text-[#7e32e2] mb-4 pb-2 border-b-2 border-purple-200">
              ข้อมูลส่วนตัว
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <div className="text-[14px] text-gray-600 mb-1">คำนำหน้า</div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.prefix}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">ชื่อ</div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.firstName}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">นามสกุล</div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.lastName}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">
                  เลขบัตรประจำตัวประชาชน
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-[16px] text-[#231d37] font-medium font-mono">
                    {maskCID(data.cid, showFullCID)}
                  </div>
                  <button
                    onClick={handleToggleCID}
                    className="p-1.5 hover:bg-purple-50 rounded-lg transition-colors"
                    title={
                      showFullCID
                        ? "ซ่อนเลขบัตรประชาชน"
                        : "แสดงเลขบัตรประชาชนแบบเต็ม"
                    }
                  >
                    {showFullCID ? (
                      <EyeOff size={18} className="text-[#7e32e2]" />
                    ) : (
                      <Eye size={18} className="text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">เพศ</div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.gender}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">กรุ๊ปเลือด</div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.bloodType}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">สภานภาพ</div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.maritalStatus}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">
                  จำนวนบุตร (ถ้ามี)
                </div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.children}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">
                  เบอร์โทร (ถ้ามี)
                </div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.phone}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">
                  อีเมล (ถ้ามี)
                </div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.email}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">
                  ระดับการศึกษา
                </div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.education}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">
                  วัน/เดือน/ปีเกิด
                </div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.birthDate}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-[14px] text-gray-600 mb-1">อาชีพ</div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.occupation}
                </div>
              </div>
            </div>
          </div>

          {/* ที่อยู่ */}
          <div className="mb-6">
            <div className="text-[18px] font-bold text-[#7e32e2] mb-4 pb-2 border-b-2 border-purple-200">
              ที่อยู่
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <div className="text-[14px] text-gray-600 mb-1">บ้านเลขที่</div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.houseNumber}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">หมู่</div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.villageNumber}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">
                  รหัสไปรษณีย์
                </div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.postalCode}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">จังหวัด</div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.province}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">อำเภอ/เขต</div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.district}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">ตำบล</div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.subdistrict}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">หมู่บ้าน</div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.village}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">
                  รหัสสถานพยาบาล
                </div>
                <div className="text-[16px] text-[#231d37] font-medium font-mono">
                  {data.hospitalCode}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-[14px] text-gray-600 mb-1">
                  คติ (ถ้ามี)
                </div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.motto}
                </div>
              </div>
            </div>
          </div>

          {/* ข้อมูลเกี่ยวกับอสม. */}
          <div className="mb-6">
            <div className="text-[18px] font-bold text-[#7e32e2] mb-4 pb-2 border-b-2 border-purple-200">
              ข้อมูลเกี่ยวกับอสม.
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <div className="text-[14px] text-gray-600 mb-1">
                  เลขบัตรประจำตัวอสม. (ถ้ามี)
                </div>
                <div className="text-[16px] text-[#231d37] font-medium font-mono">
                  {data.osmCardNumber}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">
                  วันที่เริ่มเป็นอสม. (ถ้ามี)
                </div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.osmStartDate}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">
                  ปีที่เป็นอสม. (ปี พ.ศ.)
                </div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.osmYear}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">
                  สถานะของอสม.
                </div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.osmStatus}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">
                  สถานะการรับเงิน
                </div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.paymentStatus}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">ธนาคาร</div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.bank}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">เลขบัญชี</div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.accountNumber}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-gray-600 mb-1">
                  อสม.มีสมาร์ทโฟนหรือไม่
                </div>
                <div className="text-[16px] text-[#231d37] font-medium">
                  {data.hasSmartphone}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              className="px-6 py-3 rounded-xl border border-[#7e32e2] text-[#7e32e2] text-[17px] font-semibold shadow bg-white hover:bg-[#f6eeff] transition"
              onClick={onClose}
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const OsmThaiPHCComp = () => {
  // State
  const [searchType, setSearchType] = useState("year");
  const [year, setYear] = useState("2568");
  const [month, setMonth] = useState("06");
  const [zone, setZone] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [legend, setLegend] = useState(""); // เลือก filter legend

  // Download dropdown state
  const [open, setOpen] = useState(false);
  // const dropdownRef = useRef(null);

  // Detail Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Table CID visibility state - track which rows show full CID
  const [tableCIDVisibility, setTableCIDVisibility] = useState({});

  // Filter users by selected category
  const filteredUsers = useMemo(() => {
    return legend
      ? mockUserDetails.filter((user) => user.category === legend)
      : mockUserDetails;
  }, [legend]);

  // Create table rows from filtered users
  const tableRows = useMemo(() => {
    return filteredUsers.map((user, index) => ({
      index: index + 1,
      name: `${user.prefix}${user.firstName} ${user.lastName}`,
      cid: user.cid,
      details: user,
    }));
  }, [filteredUsers]);

  // Toggle CID visibility in table
  const handleToggleTableCID = async (rowIndex) => {
    const isCurrentlyVisible = tableCIDVisibility[rowIndex];

    if (!isCurrentlyVisible) {
      // Show PDPA warning before revealing full ID
      const result = await Swal.fire({
        title: "คำเตือนตามกฎหมาย PDPA",
        html: `
          <div style="text-align: left; padding: 10px;">
            <p style="margin-bottom: 15px; font-weight: 600; color: #7e32e2;">
              ⚠️ พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
            </p>
            <p style="margin-bottom: 12px; line-height: 1.6;">
              การเปิดเผยข้อมูลส่วนบุคคล เช่น <strong>เลขบัตรประจำตัวประชาชน</strong> ต้องมีวัตถุประสงค์ที่ชอบด้วยกฎหมาย และได้รับความยินยอมจากเจ้าของข้อมูล
            </p>
            <p style="margin-bottom: 12px; line-height: 1.6;">
              การเข้าถึงข้อมูลนี้อาจถูกบันทึกไว้เพื่อการตรวจสอบ
            </p>
            <p style="margin-top: 15px; font-weight: 500; color: #555;">
              คุณต้องการดูเลขบัตรประจำตัวประชาชนแบบเต็มหรือไม่?
            </p>
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#7e32e2",
        cancelButtonColor: "#888",
        confirmButtonText: "ยืนยัน",
        cancelButtonText: "ยกเลิก",
        customClass: {
          popup: "rounded-2xl",
          title: "text-xl font-bold",
          htmlContainer: "text-base",
        },
        focusConfirm: false,
      });

      if (result.isConfirmed) {
        setTableCIDVisibility((prev) => ({ ...prev, [rowIndex]: true }));
      }
    } else {
      setTableCIDVisibility((prev) => ({ ...prev, [rowIndex]: false }));
    }
  };

  // Download Excel handler
  const handleDownloadExcel = () => {
    // Prepare data for Excel export - use filtered users
    const exportData = filteredUsers.map((user, index) => ({
      ลำดับ: index + 1,
      คำนำหน้า: user.prefix,
      ชื่อ: user.firstName,
      นามสกุล: user.lastName,
      เลขบัตรประชาชน: maskCID(user.cid, false, true), // Masked for PDPA
      เพศ: user.gender,
      หมู่โลหิต: user.bloodType,
      สถานภาพ: user.maritalStatus,
      จำนวนบุตร: user.children,
      เบอร์โทรศัพท์: user.phone,
      อีเมล: user.email,
      การศึกษา: user.education,
      วันเกิด: user.birthDate,
      อาชีพ: user.occupation,
      บ้านเลขที่: user.houseNumber,
      หมู่ที่: user.villageNumber,
      รหัสไปรษณีย์: user.postalCode,
      จังหวัด: user.province,
      อำเภอ: user.district,
      ตำบล: user.subdistrict,
      หมู่บ้าน: user.village,
      รหัสสถานพยาบาล: user.hospitalCode,
      คำขวัญ: user.motto,
      "เลขที่บัตร อสม.": user.osmCardNumber,
      "วันที่เริ่มเป็น อสม.": user.osmStartDate,
      ปีที่เข้า: user.osmYear,
      "สถานะ อสม.": user.osmStatus,
      สถานะการขอรับค่าป่วยการ: user.paymentStatus,
      ธนาคาร: user.bank,
      เลขที่บัญชี: user.accountNumber,
      มีสมาร์ทโฟน: user.hasSmartphone,
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();

    // If category is selected, add header rows
    let ws;
    if (legend) {
      const categoryText = getCategoryText(legend);
      const headerData = [
        ["รายงานข้อมูล อสม. Thai PHC"],
        [`ประเภท: ${categoryText}`],
        [], // Empty row for spacing
      ];

      // Combine header and data
      const wsData = XLSX.utils.aoa_to_sheet(headerData);
      XLSX.utils.sheet_add_json(wsData, exportData, { origin: -1 });
      ws = wsData;
    } else {
      ws = XLSX.utils.json_to_sheet(exportData);
    }

    // Set column widths
    const colWidths = [
      { wch: 8 }, // ลำดับ
      { wch: 10 }, // คำนำหน้า
      { wch: 15 }, // ชื่อ
      { wch: 15 }, // นามสกุล
      { wch: 20 }, // เลขบัตรประชาชน
      { wch: 8 }, // เพศ
      { wch: 10 }, // หมู่โลหิต
      { wch: 12 }, // สถานภาพ
      { wch: 12 }, // จำนวนบุตร
      { wch: 15 }, // เบอร์โทรศัพท์
      { wch: 25 }, // อีเมล
      { wch: 15 }, // การศึกษา
      { wch: 12 }, // วันเกิด
      { wch: 20 }, // อาชีพ
      { wch: 12 }, // บ้านเลขที่
      { wch: 8 }, // หมู่ที่
      { wch: 12 }, // รหัสไปรษณีย์
      { wch: 15 }, // จังหวัด
      { wch: 15 }, // อำเภอ
      { wch: 15 }, // ตำบล
      { wch: 20 }, // หมู่บ้าน
      { wch: 15 }, // รหัสสถานพยาบาล
      { wch: 20 }, // คำขวัญ
      { wch: 18 }, // เลขที่บัตร อสม.
      { wch: 18 }, // วันที่เริ่มเป็น อสม.
      { wch: 10 }, // ปีที่เข้า
      { wch: 12 }, // สถานะ อสม.
      { wch: 20 }, // สถานะการขอรับค่าป่วยการ
      { wch: 18 }, // ธนาคาร
      { wch: 18 }, // เลขที่บัญชี
      { wch: 12 }, // มีสมาร์ทโฟน
    ];
    ws["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "ข้อมูล อสม. Thai PHC");

    // Generate filename with current date and category
    const today = new Date();
    const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${
      today.getFullYear() + 543
    }`;
    const categoryPart = legend ? `_${legend}` : "";
    const filename = `ข้อมูล_อสม_Thai_PHC${categoryPart}_${dateStr}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);

    // Show success message
    Swal.fire({
      title: "ดาวน์โหลดสำเร็จ",
      text: `ไฟล์ ${filename} ถูกดาวน์โหลดเรียบร้อยแล้ว`,
      icon: "success",
      confirmButtonColor: "#7e32e2",
      confirmButtonText: "ตรวจสอบ",
    });
  };

  // Download PDF handler
  const handleDownloadPDF = () => {
    // Create new PDF document
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Add Thai font support
    doc.addFileToVFS("Sarabun-Regular.ttf", SarabunFont);
    doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
    doc.addFileToVFS("Sarabun-Bold.ttf", SarabunBoldFont);
    doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
    doc.setFont("Sarabun");

    // Add watermark function
    const addWatermark = (doc) => {
      const watermarkImage = "/Smart_Osm_Plus.png";
      const imgWidth = 150;
      const imgHeight = 100;

      // Landscape: 297x210
      const centerX = 297 / 2;
      const centerY = 210 / 2;

      const x = centerX - (imgWidth / 2);
      const y = centerY - (imgHeight / 2);

      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.10 }));
      doc.addImage(watermarkImage, 'PNG', x, y, imgWidth, imgHeight, '', 'NONE', 0);
      doc.restoreGraphicsState();
    };


    // Add title
    doc.setFontSize(16);
    doc.setFont("Sarabun", "bold");
    doc.text("รายงานข้อมูล อสม. Thai PHC", 148.5, 12, { align: "center" });

    // Add date
    const today = new Date();
    const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${
      today.getFullYear() + 543
    }`;
    doc.setFontSize(10);
    doc.setFont("Sarabun", "normal");
    doc.text(`วันที่: ${dateStr}`, 148.5, 18, { align: "center" });

    // Add category subtitle if filter is applied
    let startY = 28;
    if (legend) {
      const categoryText = getCategoryText(legend);
      doc.setFontSize(11);
      doc.setFont("Sarabun", "normal");
      doc.text(`ประเภท: ${categoryText}`, 148.5, 24, { align: "center" });
      startY = 32; // Move table start position down
    }

    // Prepare table data - use filtered users
    const tableData = filteredUsers.map((user, index) => [
      index + 1,
      `${user.prefix}${user.firstName} ${user.lastName}`,
      maskCID(user.cid, false, true), // Masked for PDPA
      user.province,
      user.district,
      user.subdistrict,
      user.osmStatus,
    ]);

    // Calculate table width and center position
    const colWidths = {
      no: 15,        // ลำดับ
      name: 60,      // ชื่อ-นามสกุล
      cid: 45,       // เลขบัตรประชาชน
      province: 40,  // จังหวัด
      district: 40,  // อำเภอ
      subdistrict: 40, // ตำบล
      status: 20,    // สถานะ
    };

    const totalTableWidth = Object.values(colWidths).reduce((sum, width) => sum + width, 0);
    const pageWidth = 297; // A4 landscape width
    const leftMargin = (pageWidth - totalTableWidth) / 2;

    // Add table using autoTable
    autoTable(doc, {
      head: [
        [
          "ลำดับ",
          "ชื่อ-นามสกุล",
          "เลขบัตรประชาชน",
          "จังหวัด",
          "อำเภอ",
          "ตำบล",
          "สถานะ",
        ],
      ],
      body: tableData,
      startY: startY,
      theme: "grid",
      styles: {
        font: "Sarabun",
        lineColor: [0, 0, 0], // Black border lines
        lineWidth: 0.3,
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [255, 255, 255], // White background
        textColor: [0, 0, 0], // Black text
        fontSize: 11,
        fontStyle: "bold",
        halign: "center",
        font: "Sarabun",
        cellPadding: 4,
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 3,
        font: "Sarabun",
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255], // White background
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
      },
      columnStyles: {
        0: { halign: "center", cellWidth: colWidths.no }, // ลำดับ
        1: { halign: "left", cellWidth: colWidths.name }, // ชื่อ-นามสกุล
        2: { halign: "center", cellWidth: colWidths.cid }, // เลขบัตรประชาชน
        3: { halign: "left", cellWidth: colWidths.province }, // จังหวัด
        4: { halign: "left", cellWidth: colWidths.district }, // อำเภอ
        5: { halign: "left", cellWidth: colWidths.subdistrict }, // ตำบล
        6: { halign: "center", cellWidth: colWidths.status }, // สถานะ
      },
      margin: { left: leftMargin, right: leftMargin },
      didDrawPage: function (data) {
        // Add watermark to all pages
        addWatermark(doc);

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFont("Sarabun");
        doc.setFontSize(9);
        doc.text(
          `หน้า ${data.pageNumber} จาก ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 8,
          { align: "center" }
        );
      },
    });

    // Generate filename with current date and category
    const categoryPart = legend ? `_${legend}` : "";
    const filename = `รายงาน_อสม_Thai_PHC${categoryPart}_${dateStr.replace(
      /\//g,
      "-"
    )}.pdf`;

    // Save file
    doc.save(filename);

    // Show success message
    Swal.fire({
      title: "ดาวน์โหลดสำเร็จ",
      text: `ไฟล์ ${filename} ถูกดาวน์โหลดเรียบร้อยแล้ว`,
      icon: "success",
      confirmButtonColor: "#7e32e2",
      confirmButtonText: "ตรวจสอบ",
    });
  };

  // Button styles (ใช้เหมือนภาพ ![image7](image7))
  const buttonStyle =
    "flex items-center justify-between px-6 py-2 rounded-xl border border-[#7e32e2] text-[#7e32e2] bg-white font-semibold text-[16px] focus:outline-none transition shadow-[0_2px_8px_0_rgba(126,50,226,0.10)]";
  const iconStyle = "text-[#7e32e2] mr-2";
  const arrowStyle = "text-[#7e32e2] ml-3";
  const splitStyle = "ml-4 flex items-center";

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-violet-50/30">
      <OsmDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        data={selectedUser}
      />
      <div className="w-full h-full p-6">
        {/* Header Section with Gradient */}
        <div className="relative mb-6 rounded-3xl overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-[#7e32e2] via-[#9333ea] to-[#a855f7]" />
          <div className="absolute inset-0 bg-white/5" />
          <div className="relative p-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  ข้อมูล อสม. Thai PHC
                </h1>
                <p className="text-white/90 text-sm">
                  ข้อมูลอาสาสมัครสาธารณสุขประจำหมู่บ้าน จากระบบ ThaiPHC
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search/filter */}
        <div className="w-full bg-white rounded-2xl shadow-md border border-purple-100 p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-600" />
              เลือกรูปแบบการค้นหา
            </h2>
            <div className="flex flex-wrap gap-6 items-center bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-xl">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={searchType === "year"}
                  onChange={() => setSearchType("year")}
                  className="hidden"
                />
                <span
                  className={`w-6 h-6 mr-3 rounded-full border-2 flex items-center justify-center transition-all ${
                    searchType === "year"
                      ? "border-[#7e32e2] bg-[#7e32e2] shadow-lg"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {searchType === "year" && (
                    <span className="w-3 h-3 bg-white rounded-full block" />
                  )}
                </span>
                <span
                  className={`font-semibold text-base ${
                    searchType === "year" ? "text-[#7e32e2]" : "text-gray-500"
                  }`}
                >
                  ค้นหารายปี
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={searchType === "budget"}
                  onChange={() => setSearchType("budget")}
                  className="hidden"
                />
                <span
                  className={`w-6 h-6 mr-3 rounded-full border-2 flex items-center justify-center transition-all ${
                    searchType === "budget"
                      ? "border-[#7e32e2] bg-[#7e32e2] shadow-lg"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {searchType === "budget" && (
                    <span className="w-3 h-3 bg-white rounded-full block" />
                  )}
                </span>
                <span
                  className={`font-semibold text-base ${
                    searchType === "budget" ? "text-[#7e32e2]" : "text-gray-500"
                  }`}
                >
                  ค้นหารายปีงบประมาณ
                </span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <CustomSelect
              label="ปี"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              options={YEARS}
              placeholder="เลือกปี"
              icon={Calendar}
            />
            <CustomSelect
              label="เดือน"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              options={MONTHS}
              placeholder="เลือกเดือน"
              icon={Calendar}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <CustomSelect
              label="เขตสุขภาพ"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              options={ZONES}
              placeholder="เลือกเขตสุขภาพ"
              icon={MapPin}
            />
            <CustomSelect
              label="จังหวัด"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              options={PROVINCES}
              placeholder="เลือกจังหวัด"
              icon={MapPin}
            />
            <CustomSelect
              label="อำเภอ"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              options={DISTRICTS}
              placeholder="เลือกอำเภอ"
              icon={MapPin}
            />
            <CustomSelect
              label="ตำบล"
              value={subdistrict}
              onChange={(e) => setSubdistrict(e.target.value)}
              options={SUBDISTRICTS}
              placeholder="เลือกตำบล"
              icon={MapPin}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4 mt-6">
            <ButtonService
              icon={<Search className="w-5 h-5 mr-2 text-white" />}
              variant="primary"
              size="md"
              className="w-full md:w-fit flex-1 h-14 text-lg bg-gradient-to-r from-[#7e32e2] to-[#9333ea] hover:from-[#6c28c8] hover:to-[#7e32e2] border-none text-white rounded-xl font-semibold flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
              onClick={() => {
                /* handle search */
              }}
            >
              ค้นหา
            </ButtonService>
            <ButtonService
              variant="secondary"
              size="md"
              className="w-full md:w-fit flex-1 h-14 text-lg bg-white border-2 border-purple-300 text-purple-600 hover:bg-purple-50 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
              onClick={() => {
                setYear("");
                setMonth("");
                setZone("");
                setProvince("");
                setDistrict("");
                setSubdistrict("");
                setLegend("");
              }}
            >
              ล้างข้อมูลการค้นหา
            </ButtonService>
          </div>
        </div>

        {/* Province Pie Chart (ด้านบน chart เมื่อค้นด้วยจังหวัด) */}
        {showProvinceChart(province) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Pie chart province */}
            <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
              <div
                className="text-[17px] font-semibold mb-2"
                style={{
                  color: "#8a61e5",
                  letterSpacing: "-1px",
                  marginBottom: "4px",
                  width: "100%",
                }}
              >
                แผนภาพ
              </div>
              <div
                className="w-full"
                style={{
                  height: 2,
                  background: "#ece1f7",
                  marginBottom: 18,
                  marginTop: -2,
                  borderRadius: 3,
                }}
              />
              <div
                className="flex flex-col items-center justify-center"
                style={{ width: 250, height: 250 }}
              >
                <Doughnut
                  data={provincePieChartData}
                  options={provincePieChartOptions}
                />
              </div>
              <div className="flex items-center justify-center gap-7 mt-6">
                {provincePieSummary.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-[17px] font-semibold"
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        background: d.color,
                        borderRadius: 8,
                        display: "inline-block",
                      }}
                    />
                    <span style={{ color: d.textColor }}>
                      {d.value.toLocaleString()}
                    </span>
                    <span className="text-[#888] text-[14px] font-normal">
                      คน
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* รายละเอียดจังหวัด */}
            <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 flex flex-col hover:shadow-xl transition-shadow">
              <div
                className="text-[17px] font-semibold mb-2"
                style={{
                  color: "#1ac6ae",
                  letterSpacing: "-1px",
                  marginBottom: "4px",
                  width: "100%",
                }}
              >
                จำนวน อสม.
              </div>
              <div
                className="w-full"
                style={{
                  height: 2,
                  background: "#ece1f7",
                  marginBottom: 18,
                  marginTop: -2,
                  borderRadius: 3,
                }}
              />
              <div className="flex flex-col gap-3">
                {provincePieData.map((d, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-[16px] font-medium"
                  >
                    {d.icon}
                    <span className="font-normal" style={{ color: "#231d37" }}>
                      {d.label}
                    </span>
                    <span
                      className="ml-auto font-semibold"
                      style={{ color: d.textColor, fontSize: "19px" }}
                    >
                      {d.value.toLocaleString()}
                    </span>
                    <span
                      className="text-[#888] font-normal text-[14px]"
                      style={{ marginLeft: 4 }}
                    >
                      คน
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chart + detail (ตามปกติ) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* LEFT: Pie chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
            <div
              className="text-[17px] font-semibold mb-2"
              style={{
                color: "#7e32e2",
                letterSpacing: "-1px",
                marginBottom: "4px",
                width: "100%",
              }}
            >
              แผนภาพ
            </div>
            <div
              className="w-full"
              style={{
                height: 2,
                background: "#ece1f7",
                marginBottom: 18,
                marginTop: -2,
                borderRadius: 3,
              }}
            />
            <div
              className="flex flex-col items-center justify-center"
              style={{ width: 250, height: 250 }}
            >
              <Doughnut data={pieChartData} options={pieChartOptions} />
            </div>
            <div className="flex items-center justify-center gap-7 mt-6">
              {pieDataSummary.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-[17px] font-semibold"
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      background: d.color,
                      borderRadius: 8,
                      display: "inline-block",
                    }}
                  />
                  <span style={{ color: d.textColor }}>
                    {d.value.toLocaleString()}
                  </span>
                  <span className="text-[#888] text-[14px] font-normal">
                    คน
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* RIGHT: จำนวน อสม.แยกตามประเภท */}
          <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 flex flex-col hover:shadow-xl transition-shadow">
            <div
              className="text-[17px] font-semibold mb-2"
              style={{
                color: "#7e32e2",
                letterSpacing: "-1px",
                marginBottom: "4px",
                width: "100%",
              }}
            >
              จำนวน อสม.แจกแจงตามแหล่งที่มาและการตรวจสอบข้อมูล
            </div>
            <div
              className="w-full"
              style={{
                height: 2,
                background: "#ece1f7",
                marginBottom: 18,
                marginTop: -2,
                borderRadius: 3,
              }}
            />
            <div className="flex flex-col gap-3">
              {pieData.map((d, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-[16px] font-medium"
                >
                  <span
                    className="w-5 h-5 rounded-lg flex items-center justify-center"
                    style={{ background: d.color }}
                  >
                    <svg width="20" height="20">
                      <circle cx="10" cy="10" r="8" fill={d.color} />
                    </svg>
                  </span>
                  <span className="font-normal" style={{ color: "#231d37" }}>
                    {d.label}
                  </span>
                  <span
                    className="ml-auto font-semibold"
                    style={{ color: d.textColor, fontSize: "19px" }}
                  >
                    {d.value.toLocaleString()}
                  </span>
                  <span
                    className="text-[#888] font-normal text-[14px]"
                    style={{ marginLeft: 4 }}
                  >
                    คน
                  </span>
                </div>
              ))}
              {/* Extra rows (static, สีเทา) */}
              <div className="flex items-center gap-2 mt-2 text-[16px] font-medium">
                <span className="w-5 h-5 rounded-lg flex items-center justify-center bg-[#888]">
                  <svg width="20" height="20">
                    <rect
                      x="3"
                      y="3"
                      width="14"
                      height="14"
                      rx="3"
                      fill="#888"
                    />
                  </svg>
                </span>
                <span className="font-normal" style={{ color: "#231d37" }}>
                  จำนวน อสม. จาก ThaiPHC ที่ไม่เข้าเงื่อนไข
                  <span className="text-[#888] font-normal text-[15px] ml-2">
                    (จำหน่ายหรือหมดอายุสมาชิก)
                  </span>
                </span>
                <span
                  className="ml-auto font-semibold text-[#888]"
                  style={{ fontSize: "19px" }}
                >
                  3,887
                </span>
                <span
                  className="text-[#888] font-normal text-[14px]"
                  style={{ marginLeft: 4 }}
                >
                  คน
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              รายชื่อ อสม.แยกตามเขตที่ผ่านการตรวจสอบข้อมูล
            </h2>
            <div className="mt-4 mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
              <div className="flex-1">
                <CustomSelect
                  value={legend}
                  onChange={(e) => setLegend(e.target.value)}
                  options={LEGEND_OPTIONS}
                  placeholder="เลือกประเภท อสม."
                />
              </div>
              <div className="relative inline-block">
                <button
                  type="button"
                  className="flex items-center justify-between px-6 py-3 rounded-xl border-2 border-purple-500 text-purple-600 bg-white font-semibold text-base hover:bg-purple-50 transition-all shadow-md hover:shadow-lg w-full md:w-auto"
                  onClick={() => setOpen((s) => !s)}
                  aria-haspopup="true"
                  aria-expanded={open}
                >
                  <span className="flex items-center">
                    <Download className="w-5 h-5 mr-2" />
                    ดาวน์โหลดเอกสาร
                  </span>
                  <ChevronDown className="w-5 h-5 ml-4" />
                </button>
                {open && (
                  <div className="absolute z-30 right-0 mt-2 w-64 bg-white shadow-xl rounded-xl border border-purple-200 py-2">
                    <button
                      className="flex items-center w-full px-5 py-3 gap-3 text-gray-700 text-base hover:bg-purple-50 transition font-medium"
                      onClick={() => {
                        setOpen(false);
                        handleDownloadExcel();
                      }}
                    >
                      <Image
                        src="/xlsx.png"
                        alt="Excel icon"
                        width={28}
                        height={28}
                        className="w-7 h-7"
                      />
                      ดาวน์โหลดเอกสาร Excel
                    </button>
                    <button
                      className="flex items-center w-full px-5 py-3 gap-3 text-gray-700 text-base hover:bg-purple-50 transition font-medium"
                      onClick={() => {
                        setOpen(false);
                        handleDownloadPDF();
                      }}
                    >
                      <Image
                        src="/pdf.png"
                        alt="PDF icon"
                        width={28}
                        height={28}
                        className="w-7 h-7"
                      />
                      ดาวน์โหลดเอกสาร PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-purple-100">
            <table
              className="w-full text-base border-separate"
              style={{ borderSpacing: 0, minWidth: "900px" }}
            >
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-violet-600 text-white">
                  <th className="py-4 px-6 font-bold text-center rounded-tl-xl">
                    ลำดับ
                  </th>
                  <th className="py-4 px-6 font-bold text-left">
                    รายชื่อ ({tableRows.length} รายการ)
                  </th>
                  <th className="py-4 px-6 font-bold text-center">
                    เลขประจำตัวประชาชน
                  </th>
                  <th className="py-4 px-6 font-bold text-center rounded-tr-xl">
                    สถานะการเปลี่ยนแปลง
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`${
                      idx % 2 === 0 ? "bg-white" : "bg-purple-50/40"
                    } hover:bg-purple-100/50 transition-colors`}
                  >
                    <td className="py-4 px-6 text-center align-middle font-semibold text-gray-700">
                      {row.index}
                    </td>
                    <td className="py-4 px-6 align-middle font-medium text-gray-800">
                      {row.name}
                    </td>
                    <td className="py-4 px-6 text-center align-middle">
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-gray-600 font-mono">
                          {maskCID(row.cid, tableCIDVisibility[idx], true)}
                        </div>
                        <button
                          onClick={() => handleToggleTableCID(idx)}
                          className="p-1.5 hover:bg-purple-50 rounded-lg transition-colors"
                          title={
                            tableCIDVisibility[idx]
                              ? "ซ่อนเลขบัตรประชาชน"
                              : "แสดงเลขบัตรประชาชนแบบเต็ม"
                          }
                        >
                          {tableCIDVisibility[idx] ? (
                            <EyeOff size={18} className="text-[#7e32e2]" />
                          ) : (
                            <Eye size={18} className="text-gray-500" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center align-middle">
                      <ButtonService
                        icon={<Eye className="w-5 h-5" />}
                        variant="secondary"
                        size="md"
                        className="border-2 border-purple-500 text-purple-600 hover:bg-purple-50 font-semibold shadow-md hover:shadow-lg transition-all rounded-lg px-4 py-2"
                        onClick={() => {
                          setSelectedUser(row.details);
                          setDetailModalOpen(true);
                        }}
                      >
                        ดูรายละเอียด
                      </ButtonService>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OsmThaiPHCComp;

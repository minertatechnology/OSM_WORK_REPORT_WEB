import React, { useEffect, useMemo, useRef, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import thMapGeoJSON from "@highcharts/map-collection/countries/th/th-all.geo.json";

/** โทนสีให้เหมือนภาพตัวอย่าง */
const ZONE_COLORS = [
  "#E5E5E5", // 0 สีเทา (ไม่มีข้อมูล หรือไม่ได้ส่งเขตสุขภาพ)
  "#3D0072", // 1
  "#6C59B4", // 2
  "#6D6FB0", // 3
  "#8384C4", // 4
  "#B56CC1", // 5
  "#C872CF", // 6
  "#E5A4C6", // 7
  "#F1B7E5", // 8
  "#F7C7C3", // 9
  "#FF80A0", // 10
  "#FF4C7F", // 11
  "#FF5A93", // 12
  "#D37BD3", // 13
];

/** ตำแหน่งป้ายเลข (lat, lon) ต่อ "เขตสุขภาพ" เพื่อให้เหมือนรูป */
const ZONE_LABELS = [
  null, // 0
  { zone: 1, name: "เขต 1", lat: 19.2, lon: 99.1 },
  { zone: 2, name: "เขต 2", lat: 18.3, lon: 100.1 },
  { zone: 3, name: "เขต 3", lat: 16.3, lon: 100.2 },
  { zone: 4, name: "เขต 4", lat: 14.9, lon: 100.9 },
  { zone: 5, name: "เขต 5", lat: 14.0, lon: 99.6 },
  { zone: 6, name: "เขต 6", lat: 13.2, lon: 101.5 },
  { zone: 7, name: "เขต 7", lat: 16.4, lon: 103.3 },
  { zone: 8, name: "เขต 8", lat: 17.6, lon: 102.7 },
  { zone: 9, name: "เขต 9", lat: 15.2, lon: 102.1 },
  { zone: 10, name: "เขต 10", lat: 15.4, lon: 104.9 },
  { zone: 11, name: "เขต 11", lat: 9.1, lon: 99.1 },
  { zone: 12, name: "เขต 12", lat: 7.2, lon: 100.2 },
  { zone: 13, name: "เขต 13", lat: 13.75, lon: 100.5 }, // กทม.
];

/**
 * แม็ปจังหวัด -> เขตสุขภาพ (อ้างอิงชื่อจังหวัดภาษาไทยหลัก ๆ)
 * หมายเหตุ: หากชื่อในไฟล์ GeoJSON เป็นภาษาอังกฤษ Highcharts มักมี field 'name' เป็นอังกฤษ
 */
const PROVINCE_TO_ZONE = {
  // เขต 1 (เหนือบน)
  เชียงใหม่: 1,
  "Chiang Mai": 1,
  เชียงราย: 1,
  "Chiang Rai": 1,
  แม่ฮ่องสอน: 1,
  "Mae Hong Son": 1,
  พะเยา: 1,
  Phayao: 1,
  น่าน: 1,
  Nan: 1,
  แพร่: 1,
  Phrae: 1,
  ลำพูน: 1,
  Lamphun: 1,
  ลำปาง: 1,
  Lampang: 1,

  // เขต 2 (เหนือกลาง/ล่าง)
  ตาก: 2,
  Tak: 2,
  สุโขทัย: 2,
  Sukhothai: 2,
  พิษณุโลก: 2,
  Phitsanulok: 2,
  พิจิตร: 2,
  Phichit: 2,
  เพชรบูรณ์: 2,
  Phetchabun: 2,
  อุตรดิตถ์: 2,
  Uttaradit: 2,
  กำแพงเพชร: 2,
  "Kamphaeng Phet": 2,

  // เขต 3 (ลพบุรี/สวรรค์/ภาคกลางตอนบน)
  นครสวรรค์: 3,
  "Nakhon Sawan": 3,
  อุทัยธานี: 3,
  "Uthai Thani": 3,
  ชัยนาท: 3,
  "Chai Nat": 3,
  สิงห์บุรี: 3,
  "Sing Buri": 3,
  ลพบุรี: 3,
  "Lop Buri": 3,

  // เขต 4 (รอบ กทม. ด้านเหนือ/ตะวันออกเฉียงเหนือ)
  พระนครศรีอยุธยา: 4,
  "Phra Nakhon Si Ayutthaya": 4,
  Ayutthaya: 4,
  อ่างทอง: 4,
  "Ang Thong": 4,
  สระบุรี: 4,
  Saraburi: 4,
  ปทุมธานี: 4,
  "Pathum Thani": 4,
  นนทบุรี: 4,
  Nonthaburi: 4,
  นครนายก: 4,
  "Nakhon Nayok": 4,

  // เขต 5 (ตะวันตก/ภาคกลางชายฝั่งอ่าวไทย)
  ราชบุรี: 5,
  Ratchaburi: 5,
  กาญจนบุรี: 5,
  Kanchanaburi: 5,
  สุพรรณบุรี: 5,
  "Suphan Buri": 5,
  นครปฐม: 5,
  "Nakhon Pathom": 5,
  สมุทรสาคร: 5,
  "Samut Sakhon": 5,
  สมุทรสงคราม: 5,
  "Samut Songkhram": 5,
  เพชรบุรี: 5,
  Phetchaburi: 5,
  ประจวบคีรีขันธ์: 5,
  "Prachuap Khiri Khan": 5,

  // เขต 6 (ภาคตะวันออก)
  ฉะเชิงเทรา: 6,
  Chachoengsao: 6,
  ปราจีนบุรี: 6,
  "Prachin Buri": 6,
  สระแก้ว: 6,
  "Sa Kaeo": 6,
  ชลบุรี: 6,
  "Chon Buri": 6,
  Chonburi: 6,
  ระยอง: 6,
  Rayong: 6,
  จันทบุรี: 6,
  Chanthaburi: 6,
  ตราด: 6,
  Trat: 6,
  สมุทรปราการ: 6,
  "Samut Prakan": 6,

  // เขต 7 (อีสานกลาง – ขอนแก่น)
  ขอนแก่น: 7,
  "Khon Kaen": 7,
  ร้อยเอ็ด: 7,
  "Roi Et": 7,
  มหาสารคาม: 7,
  "Maha Sarakham": 7,
  กาฬสินธุ์: 7,
  Kalasin: 7,

  // เขต 8 (อีสานบน – อุดรธานี)
  อุดรธานี: 8,
  "Udon Thani": 8,
  หนองคาย: 8,
  "Nong Khai": 8,
  เลย: 8,
  Loei: 8,
  หนองบัวลำภู: 8,
  "Nong Bua Lam Phu": 8,
  บึงกาฬ: 8,
  "Bueng Kan": 8,
  สกลนคร: 8,
  "Sakon Nakhon": 8,
  นครพนม: 8,
  "Nakhon Phanom": 8,

  // เขต 9 (อีสานล่าง – โคราช)
  นครราชสีมา: 9,
  "Nakhon Ratchasima": 9,
  บุรีรัมย์: 9,
  "Buri Ram": 9,
  Buriram: 9,
  สุรินทร์: 9,
  Surin: 9,
  ชัยภูมิ: 9,
  Chaiyaphum: 9,

  // เขต 10 (อีสานตะวันออก – อุบล)
  อุบลราชธานี: 10,
  "Ubon Ratchathani": 10,
  ศรีสะเกษ: 10,
  "Si Sa Ket": 10,
  ยโสธร: 10,
  Yasothon: 10,
  อำนาจเจริญ: 10,
  "Amnat Charoen": 10,
  มุกดาหาร: 10,
  Mukdahan: 10,

  // เขต 11 (ใต้บน/อันดามัน-อ่าวไทยตอนบน)
  สุราษฎร์ธานี: 11,
  "Surat Thani": 11,
  นครศรีธรรมราช: 11,
  "Nakhon Si Thammarat": 11,
  ชุมพร: 11,
  Chumphon: 11,
  ระนอง: 11,
  Ranong: 11,
  ภูเก็ต: 11,
  Phuket: 11,
  พังงา: 11,
  Phangnga: 11,
  "Phang Nga": 11,
  กระบี่: 11,
  Krabi: 11,

  // เขต 12 (ใต้ล่าง/ชายแดนใต้)
  สงขลา: 12,
  Songkhla: 12,
  สตูล: 12,
  Satun: 12,
  ตรัง: 12,
  Trang: 12,
  พัทลุง: 12,
  Phatthalung: 12,
  ปัตตานี: 12,
  Pattani: 12,
  ยะลา: 12,
  Yala: 12,
  นราธิวาส: 12,
  Narathiwat: 12,

  // เขต 13 (กทม.)
  กรุงเทพมหานคร: 13,
  Bangkok: 13,
  "Bangkok Metropolis": 13,
};

class MapThailandService {
  constructor() {
    this.highchartsReady = false;
    this.initPromise = null;
  }
  async initialize() {
    if (this.initPromise) return this.initPromise;
    this.initPromise = new Promise(async (resolve, reject) => {
      try {
        if (typeof window === "undefined") {
          resolve(false);
          return;
        }
        const apply = (mod) => {
          if (!mod) return;
          const fn = mod.default || mod;
          if (typeof fn === "function") fn(Highcharts);
        };
        const [mapMod, exportingMod, accMod] = await Promise.all([
          import("highcharts/modules/map").catch(() => null),
          import("highcharts/modules/exporting").catch(() => null),
          import("highcharts/modules/accessibility").catch(() => null),
        ]);
        apply(mapMod);
        apply(exportingMod);
        apply(accMod);
        this.highchartsReady = true;
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
    return this.initPromise;
  }
  /**
   * สร้างข้อมูล series สำหรับแผนที่
   * ถ้าไม่ได้ส่งเขตสุขภาพ หรือ zone เป็น 0 ให้เป็นสีเทา
   */
  createSeriesData() {
    return thMapGeoJSON.features.map((feature) => {
      const key = feature.properties["hc-key"];
      const name = feature.properties.name || "";
      // ถ้าไม่มี mapping (undefined) หรือเป็น 0 ให้เป็น 0 (สีเทา)
      const zone =
        PROVINCE_TO_ZONE.hasOwnProperty(name) && PROVINCE_TO_ZONE[name]
          ? PROVINCE_TO_ZONE[name]
          : 0;
      return { "hc-key": key, value: zone, name };
    });
  }
  /**
   * สร้าง dataClasses สำหรับสี (รวมสีเทาสำหรับ value=0)
   */
  createDataClasses() {
    const classes = [
      {
        from: 0,
        to: 0,
        color: ZONE_COLORS[0],
        name: "ไม่มีข้อมูล",
      },
    ];
    for (let zone = 1; zone <= 13; zone++) {
      classes.push({
        from: zone,
        to: zone,
        color: ZONE_COLORS[zone],
        name: `เขต ${zone}`,
      });
    }
    return classes;
  }
  createZoneBadges() {
    return ZONE_LABELS.filter(Boolean).map((zoneLabel) => ({
      name: zoneLabel.name,
      lat: zoneLabel.lat,
      lon: zoneLabel.lon,
      zone: zoneLabel.zone,
    }));
  }
  createMapOptions(height = 740, customOptions = {}) {
    const seriesData = this.createSeriesData();
    const dataClasses = this.createDataClasses();
    const zoneBadges = this.createZoneBadges();

    // Debug: ดูว่า customOptions มีอะไร
    console.log('🔧 createMapOptions called with customOptions:', {
      hasColorAxis: !!customOptions.colorAxis,
      hasDataClasses: !!customOptions.colorAxis?.dataClasses,
      dataClassesLength: customOptions.colorAxis?.dataClasses?.length,
      firstClass: customOptions.colorAxis?.dataClasses?.[0]
    });

    // Default options
    const defaultOptions = {
      chart: {
        map: thMapGeoJSON,
        height,
        backgroundColor: "transparent",
      },
      title: { text: "" },
      credits: { enabled: false },
      legend: { enabled: false },
      mapNavigation: {
        enabled: true,
        enableButtons: true,
        enableMouseWheelZoom: true,
        enableDoubleClickZoom: true,
        buttonOptions: { verticalAlign: "bottom" },
      },
      colorAxis: {
        min: 0,
        max: 13,
        dataClasses,
      },
      plotOptions: {
        series: {
          borderColor: "#ffffff",
          borderWidth: 1,
          states: { hover: { color: "#E6E6E6" } },
        },
        map: {
          nullColor: ZONE_COLORS[0], // สีเทาสำหรับ value=0
        },
      },
      tooltip: {
        formatter: function () {
          if (this.point && typeof this.point.value !== "undefined") {
            const zone = this.point.value || 0;
            return `<b>${this.point.name}</b><br/>เขตสุขภาพ: ${
              zone === 0 ? "-" : zone
            }`;
          }
          return false;
        },
        useHTML: true,
      },
      series: [
        {
          type: "map",
          name: "Thailand Provinces",
          data: seriesData,
          joinBy: "hc-key",
        },
        {
          type: "mappoint",
          name: "Zone Badges",
          data: zoneBadges,
          enableMouseTracking: false,
          showInLegend: false,
          marker: {
            symbol: "circle",
            radius: 14,
            fillColor: "#ffffff",
            lineWidth: 0,
          },
          dataLabels: {
            enabled: true,
            formatter: function () {
              return this.point.zone;
            },
            style: {
              fontSize: "12px",
              fontWeight: "bold",
              color: "#333",
              textOutline: "none",
            },
          },
        },
      ],
    };

    // Deep merge customOptions - ให้ colorAxis.dataClasses จาก customOptions override ได้
    if (customOptions.colorAxis?.dataClasses) {
      console.log('📍 Applying custom dataClasses:', customOptions.colorAxis.dataClasses.length, 'classes');
      defaultOptions.colorAxis.dataClasses = customOptions.colorAxis.dataClasses;
      defaultOptions.colorAxis.min = customOptions.colorAxis.min ?? 0;
      defaultOptions.colorAxis.max = customOptions.colorAxis.max ?? 13;
    }
    if (customOptions.tooltip) {
      defaultOptions.tooltip = { ...defaultOptions.tooltip, ...customOptions.tooltip };
    }
    if (customOptions.plotOptions) {
      defaultOptions.plotOptions = {
        ...defaultOptions.plotOptions,
        ...customOptions.plotOptions,
        series: {
          ...defaultOptions.plotOptions.series,
          ...(customOptions.plotOptions.series || {}),
        },
      };
    }

    return defaultOptions;
  }
  getHealthZoneByProvince(provinceName) {
    // ถ้าไม่มี mapping หรือ zone เป็น 0 ให้ return 0
    return PROVINCE_TO_ZONE.hasOwnProperty(provinceName) &&
      PROVINCE_TO_ZONE[provinceName]
      ? PROVINCE_TO_ZONE[provinceName]
      : 0;
  }
  getZoneColor(zoneNumber) {
    return ZONE_COLORS[zoneNumber] || ZONE_COLORS[0];
  }
}

// ตำแหน่งศูนย์กลางของแต่ละเขตสุขภาพ (lat, lon) สำหรับ zoom
const ZONE_CENTER = {
  1: { lat: 19.0, lon: 99.5, zoom: 4 },    // เหนือบน
  2: { lat: 17.5, lon: 100.0, zoom: 4 },   // เหนือล่าง
  3: { lat: 15.5, lon: 100.0, zoom: 5 },   // ภาคกลางตอนบน
  4: { lat: 14.5, lon: 100.5, zoom: 5 },   // รอบ กทม.
  5: { lat: 13.5, lon: 99.5, zoom: 5 },    // ตะวันตก
  6: { lat: 13.0, lon: 101.5, zoom: 5 },   // ตะวันออก
  7: { lat: 16.5, lon: 103.0, zoom: 5 },   // อีสานกลาง
  8: { lat: 17.5, lon: 102.5, zoom: 4 },   // อีสานบน
  9: { lat: 15.0, lon: 102.5, zoom: 5 },   // อีสานล่าง
  10: { lat: 15.5, lon: 104.5, zoom: 5 },  // อีสานตะวันออก
  11: { lat: 9.0, lon: 99.0, zoom: 4 },    // ใต้บน
  12: { lat: 7.0, lon: 100.5, zoom: 5 },   // ใต้ล่าง
  13: { lat: 13.75, lon: 100.5, zoom: 8 }, // กทม.
};

// ตำแหน่งศูนย์กลางของแต่ละจังหวัด (lat, lon) สำหรับ zoom
const PROVINCE_CENTER = {
  // เขต 1
  "เชียงใหม่": { lat: 18.8, lon: 98.9, zoom: 6 },
  "เชียงราย": { lat: 19.9, lon: 99.8, zoom: 6 },
  "แม่ฮ่องสอน": { lat: 19.3, lon: 97.9, zoom: 6 },
  "พะเยา": { lat: 19.2, lon: 99.9, zoom: 6 },
  "น่าน": { lat: 18.8, lon: 100.8, zoom: 6 },
  "แพร่": { lat: 18.1, lon: 100.1, zoom: 7 },
  "ลำพูน": { lat: 18.6, lon: 99.0, zoom: 7 },
  "ลำปาง": { lat: 18.3, lon: 99.5, zoom: 6 },
  // เขต 2
  "ตาก": { lat: 16.9, lon: 99.1, zoom: 6 },
  "สุโขทัย": { lat: 17.0, lon: 99.8, zoom: 7 },
  "พิษณุโลก": { lat: 16.8, lon: 100.3, zoom: 6 },
  "พิจิตร": { lat: 16.4, lon: 100.3, zoom: 7 },
  "เพชรบูรณ์": { lat: 16.4, lon: 101.2, zoom: 6 },
  "อุตรดิตถ์": { lat: 17.6, lon: 100.1, zoom: 7 },
  "กำแพงเพชร": { lat: 16.5, lon: 99.5, zoom: 7 },
  // เขต 3
  "นครสวรรค์": { lat: 15.7, lon: 100.1, zoom: 6 },
  "อุทัยธานี": { lat: 15.4, lon: 99.9, zoom: 7 },
  "ชัยนาท": { lat: 15.2, lon: 100.1, zoom: 7 },
  "สิงห์บุรี": { lat: 14.9, lon: 100.4, zoom: 8 },
  "ลพบุรี": { lat: 14.8, lon: 100.6, zoom: 7 },
  // เขต 4
  "พระนครศรีอยุธยา": { lat: 14.4, lon: 100.6, zoom: 7 },
  "อ่างทอง": { lat: 14.6, lon: 100.5, zoom: 8 },
  "สระบุรี": { lat: 14.5, lon: 100.9, zoom: 7 },
  "ปทุมธานี": { lat: 14.0, lon: 100.5, zoom: 8 },
  "นนทบุรี": { lat: 13.9, lon: 100.5, zoom: 9 },
  "นครนายก": { lat: 14.2, lon: 101.2, zoom: 7 },
  // เขต 5
  "ราชบุรี": { lat: 13.5, lon: 99.8, zoom: 7 },
  "กาญจนบุรี": { lat: 14.0, lon: 99.5, zoom: 5 },
  "สุพรรณบุรี": { lat: 14.5, lon: 100.0, zoom: 6 },
  "นครปฐม": { lat: 13.8, lon: 100.0, zoom: 7 },
  "สมุทรสาคร": { lat: 13.5, lon: 100.3, zoom: 9 },
  "สมุทรสงคราม": { lat: 13.4, lon: 99.9, zoom: 9 },
  "เพชรบุรี": { lat: 13.1, lon: 99.9, zoom: 6 },
  "ประจวบคีรีขันธ์": { lat: 11.8, lon: 99.8, zoom: 5 },
  // เขต 6
  "ฉะเชิงเทรา": { lat: 13.7, lon: 101.1, zoom: 7 },
  "ปราจีนบุรี": { lat: 14.1, lon: 101.4, zoom: 7 },
  "สระแก้ว": { lat: 13.8, lon: 102.1, zoom: 6 },
  "ชลบุรี": { lat: 13.4, lon: 100.9, zoom: 7 },
  "ระยอง": { lat: 12.7, lon: 101.3, zoom: 7 },
  "จันทบุรี": { lat: 12.6, lon: 102.1, zoom: 6 },
  "ตราด": { lat: 12.2, lon: 102.5, zoom: 7 },
  "สมุทรปราการ": { lat: 13.6, lon: 100.6, zoom: 8 },
  // เขต 7
  "ขอนแก่น": { lat: 16.4, lon: 102.8, zoom: 6 },
  "ร้อยเอ็ด": { lat: 16.1, lon: 103.7, zoom: 6 },
  "มหาสารคาม": { lat: 16.2, lon: 103.3, zoom: 7 },
  "กาฬสินธุ์": { lat: 16.4, lon: 103.5, zoom: 6 },
  // เขต 8
  "อุดรธานี": { lat: 17.4, lon: 102.8, zoom: 6 },
  "หนองคาย": { lat: 17.9, lon: 102.7, zoom: 6 },
  "เลย": { lat: 17.5, lon: 101.7, zoom: 6 },
  "หนองบัวลำภู": { lat: 17.2, lon: 102.4, zoom: 7 },
  "บึงกาฬ": { lat: 18.4, lon: 103.5, zoom: 7 },
  "สกลนคร": { lat: 17.2, lon: 104.1, zoom: 6 },
  "นครพนม": { lat: 17.4, lon: 104.8, zoom: 6 },
  // เขต 9
  "นครราชสีมา": { lat: 15.0, lon: 102.1, zoom: 5 },
  "บุรีรัมย์": { lat: 14.9, lon: 103.1, zoom: 6 },
  "สุรินทร์": { lat: 14.9, lon: 103.5, zoom: 6 },
  "ชัยภูมิ": { lat: 15.8, lon: 102.0, zoom: 6 },
  // เขต 10
  "อุบลราชธานี": { lat: 15.2, lon: 104.9, zoom: 5 },
  "ศรีสะเกษ": { lat: 15.1, lon: 104.3, zoom: 6 },
  "ยโสธร": { lat: 15.8, lon: 104.1, zoom: 7 },
  "อำนาจเจริญ": { lat: 15.9, lon: 104.6, zoom: 7 },
  "มุกดาหาร": { lat: 16.5, lon: 104.7, zoom: 7 },
  // เขต 11
  "สุราษฎร์ธานี": { lat: 9.1, lon: 99.3, zoom: 5 },
  "นครศรีธรรมราช": { lat: 8.4, lon: 100.0, zoom: 5 },
  "ชุมพร": { lat: 10.5, lon: 99.2, zoom: 6 },
  "ระนอง": { lat: 9.9, lon: 98.6, zoom: 6 },
  "ภูเก็ต": { lat: 7.9, lon: 98.4, zoom: 8 },
  "พังงา": { lat: 8.5, lon: 98.5, zoom: 6 },
  "กระบี่": { lat: 8.1, lon: 98.9, zoom: 7 },
  // เขต 12
  "สงขลา": { lat: 7.2, lon: 100.5, zoom: 6 },
  "สตูล": { lat: 6.6, lon: 100.1, zoom: 7 },
  "ตรัง": { lat: 7.6, lon: 99.6, zoom: 7 },
  "พัทลุง": { lat: 7.6, lon: 100.1, zoom: 7 },
  "ปัตตานี": { lat: 6.9, lon: 101.3, zoom: 7 },
  "ยะลา": { lat: 6.5, lon: 101.3, zoom: 7 },
  "นราธิวาส": { lat: 6.4, lon: 101.8, zoom: 6 },
  // เขต 13
  "กรุงเทพมหานคร": { lat: 13.75, lon: 100.5, zoom: 9 },
};

const MapThailandComponent = ({
  height = 740,
  customOptions = {},
  onMapReady = null,
  onProvinceClick = null,
  provincesWithData = null, // รายชื่อจังหวัดที่มีข้อมูล (ถ้าไม่ส่งมา = แสดงทุกจังหวัด)
  zoomToZone = null,        // เขตสุขภาพที่ต้องการ zoom (1-13)
  zoomToProvince = null,    // ชื่อจังหวัดที่ต้องการ zoom (ภาษาไทย)
}) => {
  const chartRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [mapService] = useState(() => new MapThailandService());

  useEffect(() => {
    let mounted = true;
    mapService
      .initialize()
      .then((isReady) => {
        if (mounted) {
          setReady(isReady);
          if (isReady && onMapReady) onMapReady(mapService);
        }
      })
      .catch((error) => {
        console.error("Map initialization error:", error);
      });
    return () => {
      mounted = false;
    };
  }, [mapService, onMapReady]);

  // Zoom to zone or province when they change
  useEffect(() => {
    if (!ready || !chartRef.current) return;

    const chart = chartRef.current.chart;
    if (!chart || !chart.series || !chart.series[0]) return;

    const mapSeries = chart.series[0];

    // Debug: แสดงชื่อจังหวัดทั้งหมดใน map
    const allPointNames = mapSeries.points?.map(p => p.name) || [];
    console.log('🗺️ Map zoom triggered:', {
      zoomToZone,
      zoomToProvince,
      pointsCount: mapSeries.points?.length,
      sampleNames: allPointNames.slice(0, 5) // แสดง 5 ชื่อแรก
    });

    // รอให้ chart render เสร็จก่อน
    setTimeout(() => {
      try {
        // ถ้าเลือกจังหวัด - zoom ไปที่จังหวัด
        if (zoomToProvince) {
          console.log('🔍 Zooming to province:', zoomToProvince);

          // หาจังหวัดที่ต้องการ zoom - ลองทั้งชื่อไทยและอังกฤษ
          let point = mapSeries.points?.find(p => p.name === zoomToProvince);

          // ถ้าไม่เจอ ลองหาจาก PROVINCE_TO_ZONE (มี mapping ทั้งไทยและอังกฤษ)
          if (!point) {
            // หา zone ของจังหวัดที่เลือก
            const targetZone = PROVINCE_TO_ZONE[zoomToProvince];
            if (targetZone) {
              // หา point ที่มี zone เดียวกัน
              point = mapSeries.points?.find(p => {
                const pZone = PROVINCE_TO_ZONE[p.name];
                // ตรวจสอบว่าชื่ออังกฤษ/ไทยตรงกัน
                return pZone === targetZone &&
                  (p.name === zoomToProvince ||
                   Object.keys(PROVINCE_TO_ZONE).some(k =>
                     PROVINCE_TO_ZONE[k] === targetZone &&
                     (k === p.name || k === zoomToProvince)
                   ));
              });
            }
          }

          if (point) {
            point.zoomTo();
            console.log('✅ point.zoomTo() called for province:', point.name);
          } else {
            console.log('⚠️ Province not found in map points:', zoomToProvince);
            console.log('Available names:', allPointNames);
          }
          return;
        }

        // ถ้าเลือกเขต (ไม่ได้เลือกจังหวัด) - zoom ไปที่เขต (รวมทุกจังหวัดในเขต)
        if (zoomToZone) {
          console.log('🔍 Zooming to zone:', zoomToZone);

          // หาจังหวัดทั้งหมดในเขตนี้
          const zonePoints = mapSeries.points?.filter(p => PROVINCE_TO_ZONE[p.name] === zoomToZone);

          if (zonePoints && zonePoints.length > 0) {
            // Zoom ไปที่จังหวัดแรกของเขต (จะได้เห็นพื้นที่โดยรวม)
            const firstPoint = zonePoints[0];
            if (firstPoint) {
              firstPoint.zoomTo();
              // Zoom out อีกนิดเพื่อเห็นทั้งเขต
              setTimeout(() => {
                if (chart.mapZoom) {
                  chart.mapZoom(0.5); // zoom out
                }
              }, 100);
              console.log('✅ Zoomed to zone:', zoomToZone, 'via province:', firstPoint.name);
            }
          } else {
            console.log('⚠️ No provinces found for zone:', zoomToZone);
          }
          return;
        }

        // ถ้าไม่ได้เลือกเขต/จังหวัด - reset zoom กลับไปเห็นทั้งประเทศ
        console.log('🔄 Resetting zoom to full map');
        if (chart.mapZoom) {
          chart.mapZoom(); // Reset to default view
        }
      } catch (err) {
        console.error('Map zoom error:', err);
      }
    }, 300);
  }, [ready, zoomToZone, zoomToProvince]);

  const options = useMemo(() => {
    if (!ready) return {};
    const mapOptions = mapService.createMapOptions(height, customOptions);

    // ถ้ามี provincesWithData ให้ซ่อนจังหวัดที่ไม่มีข้อมูล
    if (provincesWithData && provincesWithData.length > 0) {
      // แก้ไข series data ให้แสดงเฉพาะจังหวัดที่มีข้อมูล
      const mapSeries = mapOptions.series.find(s => s.type === 'map');
      if (mapSeries && mapSeries.data) {
        mapSeries.data = mapSeries.data.map(item => {
          // ตรวจสอบว่าจังหวัดนี้มีข้อมูลหรือไม่
          const hasData = provincesWithData.some(p =>
            p === item.name ||
            p === item['hc-key'] ||
            // รองรับชื่อภาษาไทยและอังกฤษ
            PROVINCE_TO_ZONE[p] === item.value
          );

          if (!hasData) {
            // ถ้าไม่มีข้อมูล ให้ซ่อน (value = null และสีโปร่งใส)
            return {
              ...item,
              value: null,
              color: 'transparent',
              borderColor: 'transparent',
            };
          }
          return item;
        });
      }

      // ซ่อน zone badges ที่ไม่มีข้อมูล
      const badgeSeries = mapOptions.series.find(s => s.type === 'mappoint');
      if (badgeSeries && badgeSeries.data) {
        // หา zones ที่มีข้อมูล
        const zonesWithData = new Set();
        provincesWithData.forEach(p => {
          const zone = PROVINCE_TO_ZONE[p];
          if (zone) zonesWithData.add(zone);
        });

        badgeSeries.data = badgeSeries.data.filter(badge =>
          zonesWithData.has(badge.zone)
        );
      }
    }

    if (onProvinceClick) {
      mapOptions.plotOptions.series.point = {
        events: {
          click: function () {
            const provinceName = this.name;
            const zoneNumber = mapService.getHealthZoneByProvince(provinceName);
            onProvinceClick({
              province: provinceName,
              zone: zoneNumber,
              color: mapService.getZoneColor(zoneNumber),
            });
          },
        },
      };
    }
    return mapOptions;
  }, [ready, height, customOptions, mapService, onProvinceClick, provincesWithData]);

  if (!ready) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#666",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        กำลังเตรียมแผนที่…
      </div>
    );
  }

  return (
    <HighchartsReact
      ref={chartRef}
      highcharts={Highcharts}
      constructorType="mapChart"
      options={options}
    />
  );
};

export { MapThailandService };
export default MapThailandComponent;

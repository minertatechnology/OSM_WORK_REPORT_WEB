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
    return {
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
      ...customOptions,
    };
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

const MapThailandComponent = ({
  height = 740,
  customOptions = {},
  onMapReady = null,
  onProvinceClick = null,
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

  const options = useMemo(() => {
    if (!ready) return {};
    const mapOptions = mapService.createMapOptions(height, customOptions);
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
  }, [ready, height, customOptions, mapService, onProvinceClick]);

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

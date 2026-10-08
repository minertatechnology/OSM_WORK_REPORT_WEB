// ✅ ข้อมูลจังหวัดตามเขตสุขภาพของประเทศไทย (ครบทั้ง 77 จังหวัด)
// อ้างอิงตามกรมอนามัย กระทรวงสาธารณสุข

export const HEALTHZONE_PROVINCES = [
  {
    zone: 1,
    zoneName: "เขตสุขภาพที่ 1",
    provinces: [
      "เชียงใหม่",
      "เชียงราย",
      "ลำพูน",
      "ลำปาง",
      "พะเยา",
      "แพร่",
      "น่าน",
      "แม่ฮ่องสอน",
    ],
  },
  {
    zone: 2,
    zoneName: "เขตสุขภาพที่ 2",
    provinces: [
      "พิษณุโลก",
      "สุโขทัย",
      "เพชรบูรณ์",
      "ตาก",
      "อุตรดิตถ์",
    ],
  },
  {
    zone: 3,
    zoneName: "เขตสุขภาพที่ 3",
    provinces: [
      "นครสวรรค์",
      "กำแพงเพชร",
      "พิจิตร",
      "ชัยนาท",
      "อุทัยธานี",
    ],
  },
  {
    zone: 4,
    zoneName: "เขตสุขภาพที่ 4",
    provinces: [
      "ปทุมธานี",
      "พระนครศรีอยุธยา",
      "นนทบุรี",
      "สระบุรี",
      "สิงห์บุรี",
      "ลพบุรี",
      "อ่างทอง",
      "นครนายก",
    ],
  },
  {
    zone: 5,
    zoneName: "เขตสุขภาพที่ 5",
    provinces: [
      "ราชบุรี",
      "กาญจนบุรี",
      "สุพรรณบุรี",
      "นครปฐม",
      "สมุทรสาคร",
      "สมุทรสงคราม",
      "เพชรบุรี",
      "ประจวบคีรีขันธ์",
    ],
  },
  {
    zone: 6,
    zoneName: "เขตสุขภาพที่ 6",
    provinces: [
      "ชลบุรี",
      "ระยอง",
      "จันทบุรี",
      "ตราด",
      "ฉะเชิงเทรา",
      "ปราจีนบุรี",
      "สระแก้ว",
      "สมุทรปราการ",
    ],
  },
  {
    zone: 7,
    zoneName: "เขตสุขภาพที่ 7",
    provinces: [
      "ขอนแก่น",
      "มหาสารคาม",
      "ร้อยเอ็ด",
      "กาฬสินธุ์",
    ],
  },
  {
    zone: 8,
    zoneName: "เขตสุขภาพที่ 8",
    provinces: [
      "อุดรธานี",
      "หนองคาย",
      "เลย",
      "หนองบัวลำภู",
      "บึงกาฬ",
      "สกลนคร",
      "นครพนม",
    ],
  },
  {
    zone: 9,
    zoneName: "เขตสุขภาพที่ 9",
    provinces: [
      "นครราชสีมา",
      "สุรินทร์",
      "บุรีรัมย์",
      "ชัยภูมิ",
    ],
  },
  {
    zone: 10,
    zoneName: "เขตสุขภาพที่ 10",
    provinces: [
      "อุบลราชธานี",
      "ศรีสะเกษ",
      "ยโสธร",
      "อำนาจเจริญ",
      "มุกดาหาร",
    ],
  },
  {
    zone: 11,
    zoneName: "เขตสุขภาพที่ 11",
    provinces: [
      "สุราษฎร์ธานี",
      "นครศรีธรรมราช",
      "ชุมพร",
      "ระนอง",
      "ภูเก็ต",
      "พังงา",
      "กระบี่",
    ],
  },
  {
    zone: 12,
    zoneName: "เขตสุขภาพที่ 12",
    provinces: [
      "สงขลา",
      "สตูล",
      "ตรัง",
      "พัทลุง",
      "ปัตตานี",
      "ยะลา",
      "นราธิวาส",
    ],
  },
  {
    zone: 13,
    zoneName: "เขตสุขภาพที่ 13",
    provinces: ["กรุงเทพมหานคร"],
  },
];

// ฟังก์ชันสร้างข้อมูลจังหวัดเป็น object { [province]: zone } สำหรับตรวจสอบ
export const PROVINCE_TO_HEALTHZONE = (() => {
  const obj = {};
  HEALTHZONE_PROVINCES.forEach((z) => {
    z.provinces.forEach((prov) => {
      obj[prov] = z.zone;
    });
  });
  return obj;
})();

// ฟังก์ชันสร้างข้อมูล summary จำนวนจังหวัดในแต่ละเขต
export const HEALTHZONE_SUMMARY = HEALTHZONE_PROVINCES.map((z) => ({
  zone: z.zone,
  zoneName: z.zoneName,
  provinceCount: z.provinces.length,
}));

/**
 * ฟังก์ชันสำหรับสร้างข้อมูลแสดงใน UI/ตาราง
 * provinces: รายชื่อจังหวัดทั้งหมดที่ต้องการแสดง
 * data: อ็อบเจกต์ { [province]: value } หรือ { [province]: { ...data } }
 * หากจังหวัดไหนไม่มีข้อมูล จะคืนค่า 0
 */
export function getHealthZoneTable(zone, data = {}) {
  const zoneObj = HEALTHZONE_PROVINCES.find((z) => z.zone === zone);
  if (!zoneObj) return [];
  return zoneObj.provinces.map((prov, idx) => ({
    index: idx + 1,
    province: prov,
    value: data[prov] ?? 0,
  }));
}

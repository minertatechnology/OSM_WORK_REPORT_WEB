import React, { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import jsPDF from "jspdf";
import { font as SarabunFont } from "../../../styles/Sarabun-Regular-normal";
import { fontbold as SarabunBoldFont } from "../../../styles/Sarabun-Regular-bold";

const Reportosm1CompDetailComp = ({ reportData }) => {
  const router = useRouter();
  const tableRef = useRef(null);
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBangkok, setIsBangkok] = useState(false);

  // ถ้าไม่มีข้อมูล ให้ใช้ค่า default
  const year = reportData?.year || "2568";
  const month = reportData?.month || "มิถุนายน";
  const name = reportData?.name || "นางสาวชบุษบก ผดุงจิตร";
  const date = reportData?.date || "";
  const externalUserId = reportData?.rawData?.external_user_id;
  // ดึง first_name จาก name (format: "prefix + first_name + space + last_name")
  // เช่น "นางAtthaphon Songpoon" -> "Atthaphon"
  const fullName = reportData?.name || "";
  const thaiPrefixes = ["นาย", "นาง", "นางสาว", "เด็กชาย", "เด็กหญิง"];
  let firstName = "";
  if (fullName) {
    let nameWithoutPrefix = fullName;
    for (const prefix of thaiPrefixes) {
      if (fullName.startsWith(prefix)) {
        nameWithoutPrefix = fullName.slice(prefix.length);
        break;
      }
    }
    // ตัด prefix ออกแล้ว split ด้วย space จะได้ first_name ก่อน
    const parts = nameWithoutPrefix.split(" ");
    firstName = parts[0] || "";
  }
  const osmCode = reportData?.rawData?.osm_code || reportData?.rawData?.osmCode || firstName || "";
  const fiscalYear = reportData?.rawData?.fiscal_year;
  const reportMonth = reportData?.rawData?.report_month;

  // เช็คว่าเป็นกรุงเทพหรือไม่ - เช็คจาก province_id = "10" เท่านั้น
  // สำคัญ: ใช้ osm_province_id จาก OSM batch API เป็นหลัก
  useEffect(() => {
    const checkBangkok = () => {
      // เช็คจาก osm_province_id ก่อน (จาก OSM batch API - สำคัญสุด)
      const osmProvinceId = reportData?.rawData?.osm_province_id;

      // แปลงเป็น string และเช็คว่าเป็น "10" หรือไม่
      const provinceId = String(osmProvinceId || "");

      // กรุงเทพมหานครมี province_id = "10" เท่านั้น
      const isBangkokUser = provinceId === "10";

      setIsBangkok(isBangkokUser);

      console.log("📍 [OSM1 Detail] Checking Bangkok:", {
        osmProvinceId,
        provinceId,
        isBangkokUser,
        rawDataKeys: reportData?.rawData ? Object.keys(reportData.rawData) : [],
        fullRawData: reportData?.rawData
      });
    };

    checkBangkok();
  }, [reportData]);
    console.log("=== Debug Export Filename ===");
    console.log("reportData:", reportData);
    console.log("reportData.rawData:", reportData?.rawData);
    console.log("reportData.rawData?.first_name:", reportData?.rawData?.first_name);
    console.log("reportData.rawData?.osm_code:", reportData?.rawData?.osm_code);
    console.log("firstName:", firstName);
    console.log("osmCode:", osmCode);
    console.log("============================");
  }, [reportData, externalUserId, fiscalYear, firstName, osmCode]);

  // Fetch activity data from API
  useEffect(() => {
    setActivityData([]);

    const fetchActivityData = async () => {
      if (!externalUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // เลือก API ตามประเภท (กรุงเทพ หรือ 67 จังหวัด)
        const baseApiUrl = process.env.NEXT_PUBLIC_API_BASE_SMART_OSM_URL;
        const apiEndpoint = isBangkok
          ? `${baseApiUrl}/report-osm1-bangkok/activity-data/all`
          : `${baseApiUrl}/report-osm1/activity-data/all`;

        // ส่ง external_user_id เป็น parameter เพื่อกรองที่ backend
        const queryParams = new URLSearchParams({
          skip: 0,
          limit: 1000,
        });

        if (externalUserId) {
          queryParams.append('external_user_id', externalUserId);
        }
        if (fiscalYear) {
          queryParams.append('fiscal_year', fiscalYear);
        }
        if (reportMonth) {
          queryParams.append('report_month', reportMonth);
        }

        const apiUrl = `${apiEndpoint}?${queryParams.toString()}`;

        console.log("🔍 [OSM1 Detail] Fetching from API:", { isBangkok, apiUrl, externalUserId, fiscalYear, reportMonth });

        const response = await fetch(apiUrl);
        const data = await response.json();

        console.log("📥 [OSM1 Detail] API Response:", {
          isBangkok,
          totalRecords: Array.isArray(data) ? data.length : 0,
          sampleData: Array.isArray(data) && data.length > 0 ? data[0] : data
        });

        // Debug: แสดงค่าที่ใช้ filter
        console.log("🔍 [OSM1 Detail] Filter values:", {
          externalUserId,
          fiscalYear,
          reportMonth,
          fiscalYearType: typeof fiscalYear,
          reportMonthType: typeof reportMonth
        });

        // Debug: แสดงค่าจาก API sample
        if (Array.isArray(data) && data.length > 0) {
          const sample = data[0];
          console.log("🔍 [OSM1 Detail] API sample values:", {
            apiExternalUserId: sample.external_user_id,
            apiFiscalYear: sample.fiscal_year,
            apiReportMonth: sample.report_month,
            apiActivityId: sample.activity_id,
            apiCategory: sample.category,
            apiFiscalYearType: typeof sample.fiscal_year,
            apiReportMonthType: typeof sample.report_month
          });

          // หา records ที่มี external_user_id ตรงกัน
          const matchingExternalId = data.filter(item => item.external_user_id === externalUserId);
          console.log("🔍 [OSM1 Detail] Records matching external_user_id:", matchingExternalId.length);

          if (matchingExternalId.length > 0) {
            console.log("🔍 [OSM1 Detail] Sample matching record:", {
              externalUserId: matchingExternalId[0].external_user_id,
              fiscalYear: matchingExternalId[0].fiscal_year,
              reportMonth: matchingExternalId[0].report_month,
              activityId: matchingExternalId[0].activity_id,
              category: matchingExternalId[0].category
            });
          }
        }

        // กรองข้อมูลเฉพาะของ external_user_id และ fiscal_year นี้
        // แปลงค่าเป็น string เพื่อเปรียบเทียบ
        // หมายเหตุ: report_month ใน API อาจเป็น undefined ถ้าไม่ได้ระบุ
        const userActivities = data.filter(
          (item) => {
            const matchExternalId = item.external_user_id === externalUserId;
            const matchFiscalYear = String(item.fiscal_year) === String(fiscalYear);
            // ถ้า API ไม่มี report_month หรือ reportMonth ไม่ได้ระบุ ให้ข้ามเงื่อนไขนี้
            const matchReportMonth = !reportMonth || item.report_month === undefined || String(item.report_month) === String(reportMonth);

            return matchExternalId && matchFiscalYear && matchReportMonth;
          }
        );

        console.log("✅ [OSM1 Detail] Filtered activities:", {
          isBangkok,
          userActivitiesCount: userActivities.length,
          userActivities: userActivities
        });

        // Log unique activity_ids จาก API เพื่อดูว่า API ส่งอะไรมา
        if (userActivities.length > 0) {
          const uniqueActivityIds = [...new Set(userActivities.map(item => item.activity_id))];
          const sampleByActivity = {};
          uniqueActivityIds.forEach(id => {
            const item = userActivities.find(i => i.activity_id === id);
            if (item) {
              sampleByActivity[id] = {
                value: item.value,
                category: item.category,
                activity_type: item.activity_type,
                notes: item.notes ? 'has notes' : 'no notes'
              };
            }
          });
          console.log("📊 [OSM1 Detail] Unique activity_ids from API:", uniqueActivityIds);
          console.log("📊 [OSM1 Detail] Sample data by activity:", sampleByActivity);

          // Log ALL fields จาก record แรกเพื่อดูว่า API ส่งอะไรมาบ้าง
          console.log("📊 [OSM1 Detail] ALL fields from first record:", Object.keys(userActivities[0]));
          console.log("📊 [OSM1 Detail] First record full data:", JSON.stringify(userActivities[0], null, 2));
        }

        setActivityData(userActivities);
      } catch (error) {
        console.error("❌ Error fetching activity data:", error);
        setActivityData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, [externalUserId, fiscalYear, reportMonth, name, reportData, isBangkok]);

  // โครงสร้างข้อมูล 12 หมวดสำหรับกรุงเทพ (ตรงกับ database report_activities_bangkok)
  const ACTIVITY_STRUCTURE_BANGKOK = React.useMemo(() => [
    // 1. การดูแลหญิงตั้งครรภ์
    { no: "1.", activity: "การดูแลหญิงตั้งครรภ์", unit: "", isMainCategory: true, category: "PREGNANT_WOMEN" },
    { no: "1.1", activity: "จำนวนหญิงตั้งครรภ์ในพื้นที่รับผิดชอบ", unit: "คน", category: "PREGNANT_WOMEN", activityId: "pregnant_women_1" },
    { no: "1.2", activity: "จำนวนหญิงตั้งครรภ์ที่ได้รับการดูแลติดตาม", unit: "คน", category: "PREGNANT_WOMEN", activityId: "pregnant_women_2" },
    { no: "1.3", activity: "จำนวนครั้งที่เยี่ยมบ้านหญิงตั้งครรภ์", unit: "ครั้ง", category: "PREGNANT_WOMEN", activityId: "pregnant_women_3" },
    { no: "1.4", activity: "จำนวนหญิงตั้งครรภ์ที่ได้รับคำแนะนำการดูแลสุขภาพ", unit: "คน", category: "PREGNANT_WOMEN", activityId: "pregnant_women_4" },
    { no: "1.5", activity: "จำนวนหญิงตั้งครรภ์ที่คลอดแล้ว", unit: "คน", category: "PREGNANT_WOMEN", activityId: "pregnant_women_5" },
    // 2. การดูแลหญิงหลังคลอด
    { no: "2.", activity: "การดูแลหญิงหลังคลอด", unit: "", isMainCategory: true, category: "POSTPARTUM_WOMEN" },
    { no: "2.1", activity: "จำนวนหญิงหลังคลอดในพื้นที่รับผิดชอบ", unit: "คน", category: "POSTPARTUM_WOMEN", activityId: "postpartum_women_1" },
    { no: "2.2", activity: "จำนวนหญิงหลังคลอดที่ได้รับการดูแลติดตาม", unit: "คน", category: "POSTPARTUM_WOMEN", activityId: "postpartum_women_2" },
    { no: "2.3", activity: "จำนวนครั้งที่เยี่ยมบ้านหญิงหลังคลอด", unit: "ครั้ง", category: "POSTPARTUM_WOMEN", activityId: "postpartum_women_3" },
    { no: "2.4", activity: "จำนวนหญิงหลังคลอดที่ได้รับคำแนะนำการดูแลสุขภาพ", unit: "คน", category: "POSTPARTUM_WOMEN", activityId: "postpartum_women_4" },
    { no: "2.5", activity: "จำนวนหญิงหลังคลอดที่ให้นมบุตร", unit: "คน", category: "POSTPARTUM_WOMEN", activityId: "postpartum_women_5" },
    // 3. การดูแลเด็กแรกเกิด - ๖ ปี
    { no: "3.", activity: "การดูแลเด็กแรกเกิด - ๖ ปี", unit: "", isMainCategory: true, category: "CHILDREN" },
    { no: "3.1", activity: "จำนวนเด็กแรกเกิด - ๖ ปี ในพื้นที่รับผิดชอบ", unit: "คน", category: "CHILDREN", activityId: "children_1" },
    { no: "3.2", activity: "จำนวนเด็กที่ได้รับการดูแลติดตาม", unit: "คน", category: "CHILDREN", activityId: "children_2" },
    { no: "3.3", activity: "จำนวนครั้งที่เยี่ยมบ้านเด็ก", unit: "ครั้ง", category: "CHILDREN", activityId: "children_3" },
    { no: "3.4", activity: "จำนวนเด็กที่ได้รับการพัฒนาการเหมาะสม", unit: "คน", category: "CHILDREN", activityId: "children_4" },
    { no: "3.5", activity: "จำนวนเด็กที่ได้รับวัคซีนครบถ้วน", unit: "คน", category: "CHILDREN", activityId: "children_5" },
    // 4. การให้คำแนะนำเรื่องการสื่อสารสุขภาวะทางเพศ
    { no: "4.", activity: "การให้คำแนะนำเรื่องการสื่อสารสุขภาวะทางเพศ", unit: "", isMainCategory: true, category: "SEXUAL_HEALTH" },
    { no: "4.1", activity: "จำนวนครั้งที่ให้คำแนะนำเรื่องสุขภาวะทางเพศ", unit: "ครั้ง", category: "SEXUAL_HEALTH", activityId: "sexual_health_1" },
    { no: "4.2", activity: "จำนวนผู้รับคำแนะนำ (เด็กและเยาวชน)", unit: "คน", category: "SEXUAL_HEALTH", activityId: "sexual_health_2" },
    { no: "4.3", activity: "จำนวนผู้รับคำแนะนำ (ผู้ปกครอง)", unit: "คน", category: "SEXUAL_HEALTH", activityId: "sexual_health_3" },
    { no: "4.4", activity: "จำนวนครั้งที่ประสานงานกับโรงเรียน", unit: "ครั้ง", category: "SEXUAL_HEALTH", activityId: "sexual_health_4" },
    // 5. การดูแลผู้สูงอายุ
    { no: "5.", activity: "การดูแลผู้สูงอายุ", unit: "", isMainCategory: true, category: "ELDERLY" },
    { no: "5.1", activity: "จำนวนผู้สูงอายุในพื้นที่รับผิดชอบ (60 ปีขึ้นไป)", unit: "คน", category: "ELDERLY", activityId: "elderly_1" },
    { no: "5.2", activity: "จำนวนผู้สูงอายุที่ได้รับการดูแลติดตาม", unit: "คน", category: "ELDERLY", activityId: "elderly_2" },
    { no: "5.3", activity: "จำนวนครั้งที่เยี่ยมบ้านผู้สูงอายุ", unit: "ครั้ง", category: "ELDERLY", activityId: "elderly_3" },
    { no: "5.4", activity: "จำนวนผู้สูงอายุที่ได้รับคำแนะนำการดูแลสุขภาพ", unit: "คน", category: "ELDERLY", activityId: "elderly_4" },
    { no: "5.5", activity: "จำนวนผู้สูงอายุที่มีผู้ดูแล", unit: "คน", category: "ELDERLY", activityId: "elderly_5" },
    // 6. การดูแลคนพิการ
    { no: "6.", activity: "การดูแลคนพิการ", unit: "", isMainCategory: true, category: "DISABLED" },
    { no: "6.1", activity: "จำนวนคนพิการในพื้นที่รับผิดชอบ", unit: "คน", category: "DISABLED", activityId: "disabled_1" },
    { no: "6.2", activity: "จำนวนคนพิการที่ได้รับการดูแลติดตาม", unit: "คน", category: "DISABLED", activityId: "disabled_2" },
    { no: "6.3", activity: "จำนวนครั้งที่เยี่ยมบ้านคนพิการ", unit: "ครั้ง", category: "DISABLED", activityId: "disabled_3" },
    { no: "6.4", activity: "จำนวนคนพิการที่ได้รับคำแนะนำการดูแลสุขภาพ", unit: "คน", category: "DISABLED", activityId: "disabled_4" },
    { no: "6.5", activity: "จำนวนคนพิการที่ได้รับการประสานงานบริการฟื้นฟู", unit: "คน", category: "DISABLED", activityId: "disabled_5" },
    // 7. การเฝ้าระวัง ป้องกัน และควบคุมโรค
    { no: "7.", activity: "การเฝ้าระวัง ป้องกัน และควบคุมโรค", unit: "", isMainCategory: true, category: "DISEASE_CONTROL" },
    { no: "7.1", activity: "จำนวนครั้งที่เฝ้าระวังโรคติดเชื้อ", unit: "ครั้ง", category: "DISEASE_CONTROL", activityId: "disease_control_1" },
    { no: "7.2", activity: "จำนวนครั้งที่ให้คำแนะนำการป้องกันโรค", unit: "ครั้ง", category: "DISEASE_CONTROL", activityId: "disease_control_2" },
    { no: "7.3", activity: "จำนวนผู้ที่ได้รับการคัดกรองโรค", unit: "คน", category: "DISEASE_CONTROL", activityId: "disease_control_3" },
    { no: "7.4", activity: "จำนวนผู้ป่วยที่ได้รับการติดตาม", unit: "คน", category: "DISEASE_CONTROL", activityId: "disease_control_4" },
    { no: "7.5", activity: "จำนวนครั้งที่ประสานงานกับสถานบริการสาธารณสุข", unit: "ครั้ง", category: "DISEASE_CONTROL", activityId: "disease_control_5" },
    // 8. การฟื้นฟูสุขภาพ
    { no: "8.", activity: "การฟื้นฟูสุขภาพ", unit: "", isMainCategory: true, category: "REHABILITATION" },
    { no: "8.1", activity: "จำนวนผู้ที่ได้รับการฟื้นฟูสุขภาพ", unit: "คน", category: "REHABILITATION", activityId: "rehabilitation_1" },
    { no: "8.2", activity: "จำนวนครั้งที่ให้คำแนะนำการฟื้นฟูสุขภาพ", unit: "ครั้ง", category: "REHABILITATION", activityId: "rehabilitation_2" },
    { no: "8.3", activity: "จำนวนผู้ที่ได้รับการฝึกทักษะการดำรงชีวิต", unit: "คน", category: "REHABILITATION", activityId: "rehabilitation_3" },
    { no: "8.4", activity: "จำนวนครั้งที่ประสานงานกับศูนย์ฟื้นฟู", unit: "ครั้ง", category: "REHABILITATION", activityId: "rehabilitation_4" },
    // 9. การปฏิบัติงานชวนผู้สูบบุหรี่/บุหรี่ไฟฟ้าให้เลิกสูบ
    { no: "9.", activity: "การปฏิบัติงานชวนผู้สูบบุหรี่/บุหรี่ไฟฟ้าให้เลิกสูบ", unit: "", isMainCategory: true, category: "SMOKING_CESSATION" },
    { no: "9.1", activity: "จำนวนผู้สูบบุหรี่/บุหรี่ไฟฟ้าในพื้นที่รับผิดชอบ", unit: "คน", category: "SMOKING_CESSATION", activityId: "smoking_cessation_1" },
    { no: "9.2", activity: "จำนวนครั้งที่ให้คำแนะนำการเลิกสูบ", unit: "ครั้ง", category: "SMOKING_CESSATION", activityId: "smoking_cessation_2" },
    { no: "9.3", activity: "จำนวนผู้ที่สนใจเลิกสูบ", unit: "คน", category: "SMOKING_CESSATION", activityId: "smoking_cessation_3" },
    { no: "9.4", activity: "จำนวนผู้ที่เลิกสูบได้", unit: "คน", category: "SMOKING_CESSATION", activityId: "smoking_cessation_4" },
    { no: "9.5", activity: "จำนวนครั้งที่ประสานงานกับสถานบริการ", unit: "ครั้ง", category: "SMOKING_CESSATION", activityId: "smoking_cessation_5" },
    // 10. การสนับสนุนอาสาสมัครประจำครอบครัว (อสค.)
    { no: "10.", activity: "การสนับสนุนอาสาสมัครประจำครอบครัว (อสค.)", unit: "", isMainCategory: true, category: "FAMILY_VOLUNTEER" },
    { no: "10.1", activity: "จำนวนอาสาสมัครประจำครอบครัว (อสค.) ในพื้นที่", unit: "คน", category: "FAMILY_VOLUNTEER", activityId: "family_volunteer_1" },
    { no: "10.2", activity: "จำนวนครั้งที่ให้ความรู้แก่ อสค.", unit: "ครั้ง", category: "FAMILY_VOLUNTEER", activityId: "family_volunteer_2" },
    { no: "10.3", activity: "จำนวนครัวเรือนที่ อสค. ดูแล", unit: "ครัวเรือน", category: "FAMILY_VOLUNTEER", activityId: "family_volunteer_3" },
    { no: "10.4", activity: "จำนวนครั้งที่ อสค. รายงานข้อมูล", unit: "ครั้ง", category: "FAMILY_VOLUNTEER", activityId: "family_volunteer_4" },
    // 11. การเข้าร่วมทีมหมอครอบครัว
    { no: "11.", activity: "การเข้าร่วมทีมหมอครอบครัว", unit: "", isMainCategory: true, category: "FAMILY_DOCTOR" },
    { no: "11.1", activity: "จำนวนครั้งที่เข้าร่วมทีมหมอครอบครัว", unit: "ครั้ง", category: "FAMILY_DOCTOR", activityId: "family_doctor_1" },
    { no: "11.2", activity: "จำนวนครัวเรือนที่ร่วมดูแล", unit: "ครัวเรือน", category: "FAMILY_DOCTOR", activityId: "family_doctor_2" },
    { no: "11.3", activity: "จำนวนผู้ที่ได้รับการคัดกรอง", unit: "คน", category: "FAMILY_DOCTOR", activityId: "family_doctor_3" },
    { no: "11.4", activity: "จำนวนครั้งที่ประสานงานกับทีมหมอครอบครัว", unit: "ครั้ง", category: "FAMILY_DOCTOR", activityId: "family_doctor_4" },
    // 12. งานอื่น ๆ ตามสภาพปัญหาชุมชน
    { no: "12.", activity: "งานอื่น ๆ ตามสภาพปัญหาชุมชน", unit: "", isMainCategory: true, category: "OTHER" },
    { no: "12.1", activity: "จำนวนกิจกรรมอื่นๆ ที่ทำในชุมชน", unit: "ครั้ง", category: "OTHER", activityId: "other_work_1" },
    { no: "12.2", activity: "จำนวนครั้งที่ทำกิจกรรมอื่นๆ", unit: "ครั้ง", category: "OTHER", activityId: "other_work_2" },
    { no: "12.3", activity: "จำนวนผู้ที่ได้รับบริการจากกิจกรรมอื่นๆ", unit: "คน", category: "OTHER", activityId: "other_work_3" },
    { no: "12.4", activity: "จำนวนครั้งที่ประสานงานกับหน่วยงานอื่น", unit: "ครั้ง", category: "OTHER", activityId: "other_work_4" },
  ], []);

  // โครงสร้างข้อมูลหัวข้อกิจกรรมตามเอกสาร PDF - แบบรายงานผลการปฏิบัติงานของ อสม. (67 จังหวัด)
  const ACTIVITY_STRUCTURE = React.useMemo(() => [
    // 1. การส่งเสริมสุขภาพ
    {
      no: "1.",
      activity: "การส่งเสริมสุขภาพ",
      unit: "",
      isMainCategory: true,
      activityId: "promote_health"
    },
    {
      no: "1.1",
      activity: "อสม. เยี่ยมให้คําแนะนําหญิงตั้งครรภ์ (รายใหม่)",
      unit: "คน",
      activityId: "promote_health_1"
    },
    {
      no: "-",
      activity: "อสม. ค้นหาหญิงตั้งครรภ์อายุต่ำกว่า ๑๕ ปี (รายใหม่)",
      unit: "คน",
      activityId: "promote_health_2"
    },
    {
      no: "-",
      activity: "อสม. ติดตามหญิงตั้งครรภ์ให้ได้รับยาเม็ดเสริมไอโอดีน",
      unit: "คน",
      activityId: "promote_health_3"
    },
    {
      no: "1.2",
      activity: "อสม.บริการเยี่ยมให้คำแนะนำหญิงหลังคลอด (รายใหม่)",
      unit: "คน",
      activityId: "promote_health_4"
    },
    {
      no: "-",
      activity: "มารดาที่ไม่สามารถเลี้ยงดูบุตรด้วยนมแม่อย่างเดียวครบ 6 เดือน (รายใหม่)",
      unit: "คน",
      activityId: "promote_health_5"
    },
    {
      no: "-",
      activity: "อสม. ติดตามหญิงหลังคลอดในนมบุตร 6 เดือน ให้ได้รับยาเม็ดเสริมไอโอดีน",
      unit: "คน",
      activityId: "promote_health_6"
    },
    {
      no: "1.3",
      activity: "อสม.เยี่ยมบ้านและให้คำแนะนำผู้สูงอายุด้านการดูแลสุขภาพ",
      unit: "คน",
      activityId: "promote_health_7"
    },
    {
      no: "-",
      activity: "ผู้สูงอายุที่เป็นโรคเรื้อรังและถูกทอดทิ้งอยู่เพียงลำพัง (รายใหม่)",
      unit: "คน",
      activityId: "promote_health_8"
    },
    {
      no: "-",
      activity: "คัดกรอง ประเมินภาวะสุขภาพผู้สูงอายุ (ภาวะถดถอย 9 ด้าน)",
      unit: "คน",
      activityId: "promote_health_9"
    },
    {
      no: "-",
      activity: "สร้างความรอบรู้ และให้บริการดูแลสุขภาพตามสภาพปัญหาภาวะถดถอยในแต่ละด้านของผู้สูงอายุ และประสานภาคีเครือข่ายในการดูแลผู้สูงอายุให้มีชีวิตความเป็นอยู่ที่ดี",
      unit: "คน",
      activityId: "promote_health_10"
    },
    {
      no: "1.4",
      activity: "อสม.เยี่ยมบ้านและให้คำแนะนำผู้พิการด้านการดูแลสุขภาพ",
      unit: "คน",
      activityId: "promote_health_11"
    },
    // 2. การเฝ้าระวัง ป้องกัน และควบคุมโรค
    {
      no: "2.",
      activity: "การเฝ้าระวัง ป้องกัน และควบคุมโรค",
      unit: "",
      isMainCategory: true,
      activityId: "protect"
    },
    {
      no: "2.1",
      activity: "เฝ้าระวัง ป้องกัน ควบคุมโรคไข้เลือดออก (ปิด เปลี่ยน ปล่อย ปรับปรุง ปฏิบัติเป็นนิสัย)",
      unit: "ครัวเรือน",
      activityId: "protect_1"
    },
    {
      no: "2.2",
      activity: "เฝ้าระวัง ป้องกัน ควบคุมโรคไข้หวัดใหญ่ (ปิด ล้าง เลี่ยง หยุด)",
      unit: "ครัวเรือน",
      activityId: "protect_2"
    },
    {
      no: "2.3",
      activity: "เฝ้าระวัง คัดกรอง และให้คำแนะนำกลุ่มเสี่ยงโรค (โรคเบาหวาน โรคความดันโลหิตสูง โรคมะเร็ง โรคหัวใจ โรคหลอดเลือดสมอง)",
      unit: "คน",
      activityId: "protect_3"
    },
    {
      no: "2.4",
      activity: "ให้คำแนะนำประชาชนบริโภคผลิตภัณฑ์/อาหาร/เกลือที่ผสมไอโอดีน",
      unit: "ครัวเรือน",
      activityId: "protect_4"
    },
    {
      no: "2.5",
      activity: "ให้คำแนะนำประชาชนลดกิน หวาน อาหารมันและเค็ม",
      unit: "ครัวเรือน",
      activityId: "protect_5"
    },
    {
      no: "2.6",
      activity: "สำรวจ เฝ้าระวัง ป้องกันโรคในกลุ่มเป้าหมาย 607 และปักหมุดแจ้งพิกัดกลุ่มเปราะบางในแอปพลิเคชันพันภัย",
      unit: "คน",
      activityId: "protect_6"
    },
    // 3. การฟื้นฟูสุขภาพ
    {
      no: "3.",
      activity: "การฟื้นฟูสุขภาพ",
      unit: "",
      isMainCategory: true,
      activityId: "recover"
    },
    {
      no: "3.1",
      activity: "เยี่ยมบ้าน ให้คำแนะนำการดูแลผู้ป่วยโรคเบาหวาน ความดันโลหิต มะเร็ง หัวใจ ฯลฯ",
      unit: "ครั้ง",
      activityId: "recover_1"
    },
    // 4. การคุ้มครองผู้บริโภค
    {
      no: "4.",
      activity: "การคุ้มครองผู้บริโภค",
      unit: "",
      isMainCategory: true,
      activityId: "consumer"
    },
    {
      no: "4.1",
      activity: "เฝ้าระวังและให้คำแนะนำการบริโภคอาหารปลอดภัย",
      unit: "ครั้ง",
      activityId: "consumer_1"
    },
    // 5. การจัดการสุขภาพชุมชนและการมีส่วนร่วมในแผนสุขภาพตำบล
    {
      no: "5.",
      activity: "การจัดการสุขภาพชุมชนและการมีส่วนร่วมในแผนสุขภาพตำบล",
      unit: "",
      isMainCategory: true,
      activityId: "community_health"
    },
    {
      no: "5.1",
      activity: "อสม.ร่วมกิจกรรมจิตอาสากับเครือข่ายอื่น",
      unit: "ครั้ง",
      activityId: "community_health_1"
    },
    {
      no: "5.2",
      activity: "จัดทำแผนสุขภาพ จัดหางบประมาณ จัดกิจกรรมสุขภาพ และประเมินผล",
      unit: "ครั้ง",
      activityId: "community_health_2"
    },
    // 6. การสนับสนุนอาสาสมัครประจำครอบครัว (อสค.)
    {
      no: "6.",
      activity: "การสนับสนุนอาสาสมัครประจำครอบครัว (อสค.)",
      unit: "",
      isMainCategory: true,
      activityId: "family_doc"
    },
    {
      no: "",
      activity: "ติดตามให้คำแนะนำ อสค. ในการดูแล อาหาร/ออกกำลังกาย/วิธีปฏิบัติ การดูแล การพยาบาล / การส่งต่อ ผู้ป่วยในครัวเรือน",
      unit: "",
      isMainCategory: false,
      activityId: null
    },
    {
      no: "(1)",
      activity: "กลุ่มผู้สูงอายุ ที่มีปัญหา ติดบ้านติดเตียง",
      unit: "คน",
      activityId: "family_doc_1"
    },
    {
      no: "(2)",
      activity: "กลุ่มผู้ป่วยโรคไม่ติดต่อเรื้อรัง",
      unit: "คน",
      activityId: "family_doc_2"
    },
    {
      no: "(3)",
      activity: "กลุ่มผู้ป่วยที่มีปัญหาโรคไต",
      unit: "คน",
      activityId: "family_doc_3"
    },
    // 7. การใช้ยาอย่างสมเหตุสมผล / การบริโภคผลิตภัณฑ์สุขภาพ
    {
      no: "7.",
      activity: "การใช้ยาอย่างสมเหตุสมผล / การบริโภคผลิตภัณฑ์สุขภาพ",
      unit: "",
      isMainCategory: true,
      activityId: "statistics"
    },
    {
      no: "(1)",
      activity: "ให้ความรู้พื้นฐานการใช้ยาปฎิชีวนะ หรือข้อควรระวังการซื้อยากินเองสำหรับโรคหวัด/ท้องเสีย และการใช้สมุนไพรที่เสี่ยงต่อการผสมสาร สเตียรอยด์",
      unit: "ครอบครัว",
      activityId: "statistics_1"
    },
    {
      no: "(2)",
      activity: "เฝ้าระวังและให้คำแนะนำการบริโภคผลิตภัณฑ์สุขภาพ และร่วมสำรวจร้านชำในชุมชน เพื่อปลอดยาปฏิชีวนะ ยาชุด",
      unit: "ครั้ง",
      activityId: "statistics_2"
    },
    // 8. การเข้าร่วมกับทีมหมอครอบครัว
    {
      no: "8.",
      activity: "การเข้าร่วมกับทีมหมอครอบครัว",
      unit: "",
      isMainCategory: true,
      activityId: "doctor_family"
    },
    {
      no: "-",
      activity: "ร่วมเป็นทีมหมอครอบครัว ในการช่วยเหลือ ดูแลผู้ป่วย และครอบครัวในชุมชน",
      unit: "ครั้ง",
      activityId: "doctor_family_1"
    },
    {
      no: "",
      activity: "กรณีเข้าร่วมทีมหมอครอบครัว อสม. ให้ความช่วยเหลือในเรื่องใด/กี่ครอบครัว",
      unit: "",
      isMainCategory: false,
      activityId: null
    },
    {
      no: "(1)",
      activity: "ช่วยปรับปรุงที่อยู่อาศัย และสิ่งแวดล้อมให้เอื้อต่อการดูแล การพยาบาล",
      unit: "ครอบครัว",
      activityId: "doctor_family_2"
    },
    {
      no: "(2)",
      activity: "เสริมพลังและกำลังใจ และเทคนิคการดูแล การพยาบาลตามปัญหาสุขภาพ ทำให้ผู้ป่วยมีกำลังใจในการดำรงชีวิต",
      unit: "ครอบครัว",
      activityId: "doctor_family_3"
    },
    // 9. กิจกรรมอื่นๆ
    {
      no: "9.",
      activity: "กิจกรรมอื่นๆ",
      unit: "",
      isMainCategory: true,
      activityId: "other_activity"
    },
    {
      no: "9.1",
      activity: "ชวนคนเลิกบุหรี่",
      unit: "คน",
      activityId: "other_activity_1"
    },
    {
      no: "9.2",
      activity: "ร่วมกับเจ้าหน้าที่ในการติดตามผู้ผ่านการบำบัดยาเสพติดในระบบสมัครใจบำบัด โดยการสร้างกระบวนการมีส่วนร่วมของคนในชุมชน",
      unit: "คน",
      activityId: "other_activity_2"
    }
  ], []);

  // ดึงข้อมูล note จาก activity_id ที่ถูกต้อง (กรุงเทพ: smoking_cessation_1, 67 จังหวัด: other_activity_1)
  const smokeData = React.useMemo(() => {
    // เลือก activity_id ตามประเภท
    const smokeActivityId = isBangkok ? "smoking_cessation_1" : "other_activity_1";
    const smokeActivity = activityData.find(item => item.activity_id === smokeActivityId);

    if (!smokeActivity) {
      return [];
    }

    // ลองทั้ง notes และ note
    const noteField = smokeActivity.notes || smokeActivity.note;

    if (!noteField) {
      return [];
    }

    try {
      const noteData = JSON.parse(noteField);
      return Array.isArray(noteData) ? noteData : [];
    } catch (error) {
      console.error("❌ Error parsing note data:", error);
      return [];
    }
  }, [activityData, isBangkok]);

  // แปลงข้อมูลจาก API โดยใช้โครงสร้างจากเอกสาร และดึงเฉพาะจำนวนจาก API
  const transformedData = React.useMemo(() => {
    // เลือกโครงสร้างตามประเภท (กรุงเทพ หรือ 67 จังหวัด)
    const currentStructure = isBangkok ? ACTIVITY_STRUCTURE_BANGKOK : ACTIVITY_STRUCTURE;

    // สร้าง Map จากข้อมูล API เพื่อหา value ตาม activityId
    const activityValueMap = new Map();

    activityData.forEach((item) => {
      // ทั้งกรุงเทพและ 67 จังหวัด ใช้ activity_id ตรงๆ (API ส่งมาถูกต้องแล้ว)
      activityValueMap.set(item.activity_id, item.value || 0);
    });

    console.log("📊 [OSM1 Detail] Activity value map:", {
      isBangkok,
      map: Object.fromEntries(activityValueMap)
    });

    // Log เพื่อดู activity IDs ที่มีใน API
    const apiActivityIds = Array.from(activityValueMap.keys());
    const expectedIds = isBangkok
      ? ACTIVITY_STRUCTURE_BANGKOK.map(i => i.activityId).filter(Boolean)
      : ACTIVITY_STRUCTURE.map(i => i.activityId).filter(Boolean);

    // หา IDs ที่ match และไม่ match
    const matchedIds = apiActivityIds.filter(id => expectedIds.includes(id));
    const unmatchedIds = apiActivityIds.filter(id => !expectedIds.includes(id));

    console.log("🔧 [OSM1 Detail] Activity mapping:", {
      isBangkok,
      apiActivityIds,
      expectedIds,
      matchedIds,
      unmatchedIds,
      matchedCount: matchedIds.length,
      unmatchedCount: unmatchedIds.length,
      activityValueMap: Object.fromEntries(activityValueMap)
    });

    // นับจำนวนจาก smokeData
    const smokeCount = smokeData.length;

    // ใช้โครงสร้างจากเอกสาร และ map ค่าจาก API
    const result = currentStructure.map((item) => {
      let resultValue = "";

      if (isBangkok) {
        // กรณีพิเศษสำหรับกรุงเทพ - smoking_cessation_1 และ smoking_cessation_2
        if (item.activityId === "smoking_cessation_1") {
          // ข้อ 9.1 แสดงจำนวนที่นับจาก notes ถ้ามี, ถ้าไม่มีให้ใช้ค่าจาก value
          resultValue = smokeCount > 0 ? smokeCount : (activityValueMap.get("smoking_cessation_1") || 0);
        } else if (item.activityId === "smoking_cessation_2") {
          // ข้อ 9.2 - กรุงเทพไม่มีข้อมูลนี้ใน 67 จังหวัด API
          resultValue = activityValueMap.get("smoking_cessation_2") || 0;
        } else if (item.activityId) {
          // กรณีปกติ
          resultValue = activityValueMap.get(item.activityId) || 0;
        }
      } else {
        // กรณีพิเศษสำหรับ 67 จังหวัด - other_activity_1 และ other_activity_2
        if (item.activityId === "other_activity_1") {
          // ข้อ 9.1 แสดงจำนวนที่นับจาก notes ถ้ามี, ถ้าไม่มีให้ใช้ค่าจาก value
          resultValue = smokeCount > 0 ? smokeCount : (activityValueMap.get("other_activity_1") || 0);
        } else if (item.activityId === "other_activity_2") {
          // ข้อ 9.2 แสดงค่า value จาก other_activity_1
          resultValue = activityValueMap.get("other_activity_1") || 0;
        } else if (item.activityId) {
          // กรณีปกติ
          resultValue = activityValueMap.get(item.activityId) || 0;
        }
      }

      return {
        no: item.no,
        activity: item.activity,
        unit: item.unit,
        result: resultValue,
        isMainCategory: item.isMainCategory || false,
        activityId: item.activityId,
        category: item.category, // เพิ่ม category สำหรับกรุงเทพ
      };
    });

    return result;
  }, [activityData, ACTIVITY_STRUCTURE, ACTIVITY_STRUCTURE_BANGKOK, smokeData, isBangkok]);

  // แสดงข้อมูลตามโครงสร้างเอกสารเสมอ (ไม่ว่า API จะมีข้อมูลหรือไม่)
  const displayData = transformedData;

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('portrait', 'mm', 'a4');

      // เพิ่ม Thai font
      doc.addFileToVFS("Sarabun-Regular.ttf", SarabunFont);
      doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
      doc.addFileToVFS("Sarabun-Bold.ttf", SarabunBoldFont);
      doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
      doc.setFont("Sarabun");

      // Add watermark function
      const addWatermark = (doc) => {
        const watermarkImage = "/Smart_Osm_Plus.png";
        const imgWidth = 150;
        const imgHeight = 150;

        // Portrait: 210x297
        const centerX = 220 / 2;
        const centerY = 360 / 2;

        const x = centerX - (imgWidth / 2);
        const y = centerY - (imgHeight / 2);

        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.10 }));
        doc.addImage(watermarkImage, 'PNG', x, y, imgWidth, imgHeight, '', 'NONE', 0);
        doc.restoreGraphicsState();
      };

      // Add watermark to the first page
      addWatermark(doc);

      // Header - Title
      doc.setFontSize(16);
      doc.setFont("Sarabun", "bold");
      // เลือก title ตามประเภท (กรุงเทพ หรือ 67 จังหวัด)
      const reportTitle = isBangkok ? "แบบรายงานผลการปฏิบัติงานของ อสม. (กรุงเทพมหานคร)" : "แบบรายงานการปฏิบัติงานของ อสม.";
      doc.text(reportTitle, 105, 18, { align: "center" });

      doc.setFontSize(16);
      doc.setFont("Sarabun", "bold");
      if (date) {
        doc.text(`วันที่: ${date}`, 105, 26, { align: "center" });
      }

      doc.setFontSize(16);
      doc.setFont("Sarabun", "bold");
      doc.text(`ชื่อ-นามสกุล: ${name}`, 105, date ? 33 : 26, { align: "center" });

      // Table settings
      const margin = 15;
      const startX = margin;
      let startY = 42;
      const rowHeight = 6;

      // กำหนดความกว้างของแต่ละคอลัมน์
      const colWidths = {
        no: 20,
        activity: 130,
        unit: 25,
        result: 15,
      };

      // วาดตาราง Header (ไม่มีกรอบ)
      doc.setFont("Sarabun", "bold");
      doc.setFontSize(12);

      let currentX = startX;

      // ลำดับ
      doc.text("ลำดับ", currentX, startY);
      currentX += colWidths.no;

      // กิจกรรมการปฏิบัติงาน
      doc.text("กิจกรรมการปฏิบัติงาน", currentX, startY);
      currentX += colWidths.activity;

      // หน่วยนับ
      doc.text("หน่วยนับ", currentX + 5, startY);
      currentX += colWidths.unit;

      // ผลงาน
      doc.text("ผลงาน", currentX + 3, startY);

      // วาดข้อมูลในตาราง
      doc.setFont("Sarabun", "normal");
      doc.setFontSize(10);

      let currentY = startY + 5;
      const maxRowsPerPage = 38;
      let rowCount = 0;

      displayData.forEach((row) => {
        // ถ้าเต็มหน้าให้สร้างหน้าใหม่
        if (rowCount >= maxRowsPerPage) {
          doc.addPage();
          addWatermark(doc); // Add watermark to new page
          currentY = 25;
          rowCount = 0;

          // วาด header ใหม่ (ไม่มีกรอบ)
          doc.setFont("Sarabun", "bold");
          doc.setFontSize(12);

          let headerX = startX;
          doc.text("ลำดับ", headerX, currentY);
          headerX += colWidths.no;

          doc.text("กิจกรรมการปฏิบัติงาน", headerX, currentY);
          headerX += colWidths.activity;

          doc.text("หน่วยนับ", headerX + 5, currentY);
          headerX += colWidths.unit;

          doc.text("ผลงาน", headerX + 3, currentY);

          currentY += 8;
          doc.setFont("Sarabun", "normal");
          doc.setFontSize(10);
        }

        let dataX = startX;

        // กำหนด font ตามประเภทแถว
        if (row.isMainCategory) {
          doc.setFont("Sarabun", "bold");
          doc.setFontSize(14);
        } else {
          doc.setFont("Sarabun", "normal");
          doc.setFontSize(10);
        }

        // กำหนด indent เฉพาะตัวเลขลำดับ (ตรงตามหน้าหลัก)
        let noIndent = 0;

        if (row.isMainCategory) {
          // หมวดหมู่หลัก (1., 2., 3., ...) - ไม่ indent
          noIndent = 0;
        } else if (row.no && (row.no.includes(".") && !row.no.startsWith("(") && row.no !== "-")) {
          // หัวข้อย่อยระดับ 1 (1.1, 1.2, 2.1, ...) - indent 4mm (ml-16 ~ 16px ~ 4mm)
          noIndent = 4;
        } else if (row.no === "-") {
          // หัวข้อย่อยระดับ 2 (-) - indent 6mm (ml-24 ~ 24px ~ 6mm)
          noIndent = 6;
        } else if (row.no && row.no.startsWith("(")) {
          // หัวข้อย่อยระดับ 3 ((1), (2), (3)) - indent 6mm (ml-24 ~ 24px ~ 6mm)
          noIndent = 6;
        } else if (row.no === "") {
          // หัวข้อคำอธิบายพิเศษ (ไม่มีเลขลำดับ) - indent 4mm
          noIndent = 4;
        }

        // ลำดับ (ไม่มีกรอบ)
        if (row.no) {
          doc.text(row.no, dataX + noIndent, currentY);
        }
        dataX += colWidths.no;

        // กิจกรรม (ไม่มีกรอบ, ไม่ indent)
        const actParts = doc.splitTextToSize(row.activity, colWidths.activity - 2);
        doc.text(actParts[0], dataX, currentY);
        dataX += colWidths.activity;

        // หน่วยนับ (ไม่มีกรอบ)
        doc.setFont("Sarabun", "normal");
        doc.setFontSize(10);
        if (row.unit) {
          doc.text(row.unit, dataX + 8, currentY);
        }
        dataX += colWidths.unit;

        // ผลงาน (ไม่มีกรอบ)
        if (row.result !== "" && row.result !== undefined && row.result !== 0) {
          doc.text(String(row.result), dataX + 5, currentY);
        }

        currentY += rowHeight;
        rowCount++;

        // แสดงรายละเอียดสำหรับ Activity 9.1 (67 จังหวัด: other_activity_1, กรุงเทพ: smoking_cessation_1)
        const smokeActivityId = isBangkok ? "smoking_cessation_1" : "other_activity_1";
        if (row.activityId === smokeActivityId && smokeData.length > 0) {
          // เพิ่มระยะห่าง
          currentY += 2;

          smokeData.forEach((item, idx) => {
            // ตรวจสอบว่าเต็มหน้าหรือไม่
            if (rowCount >= maxRowsPerPage) {
              doc.addPage();
              addWatermark(doc); // Add watermark to new page
              currentY = 25;
              rowCount = 0;

              // วาด header ใหม่
              doc.setFont("Sarabun", "bold");
              doc.setFontSize(12);

              let headerX = startX;
              doc.text("ลำดับ", headerX, currentY);
              headerX += colWidths.no;

              doc.text("กิจกรรมการปฏิบัติงาน", headerX, currentY);
              headerX += colWidths.activity;

              doc.text("หน่วยนับ", headerX + 5, currentY);
              headerX += colWidths.unit;

              doc.text("ผลงาน", headerX + 3, currentY);

              currentY += 8;
              doc.setFont("Sarabun", "normal");
              doc.setFontSize(10);
            }

            const status = item["สถานะการสูบบุหรี่"] === "smoke" ? "สูบ" : "ไม่สูบ";
            const detailText = `ลำดับ: ${idx + 1}, ชื่อ: ${item["ชื่อ"] || "-"}, เบอร์โทรศัพท์: ${item["เบอร์โทรศัพท์"] || "-"}, บ้านเลขที่: ${item["บ้านเลขที่"] || "-"}, สถานะ: ${status}`;

            doc.setFont("Sarabun", "normal");
            doc.setFontSize(8);

            // วาดข้อความรายละเอียด - เริ่มต้นที่คอลัมน์กิจกรรม (ตรงกับ pl-16)
            const detailParts = doc.splitTextToSize(detailText, colWidths.activity + colWidths.unit + colWidths.result - 10);
            detailParts.forEach((part, partIdx) => {
              if (partIdx === 0) {
                doc.text(part, startX + colWidths.no, currentY);
              } else {
                currentY += 3.5;
                rowCount++;
                if (rowCount >= maxRowsPerPage) {
                  doc.addPage();
                  addWatermark(doc); // Add watermark to new page
                  currentY = 25;
                  rowCount = 0;

                  // วาด header ใหม่
                  doc.setFont("Sarabun", "bold");
                  doc.setFontSize(12);

                  let headerX = startX;
                  doc.text("ลำดับ", headerX, currentY);
                  headerX += colWidths.no;

                  doc.text("กิจกรรมการปฏิบัติงาน", headerX, currentY);
                  headerX += colWidths.activity;

                  doc.text("หน่วยนับ", headerX + 5, currentY);
                  headerX += colWidths.unit;

                  doc.text("ผลงาน", headerX + 3, currentY);

                  currentY += 8;
                  doc.setFont("Sarabun", "normal");
                  doc.setFontSize(8);
                }
                doc.text(part, startX + colWidths.no, currentY);
              }
            });

            currentY += 4;
            rowCount++;
          });

          // เพิ่มระยะห่างหลังข้อมูล note ก่อนข้อ 9.2
          currentY += 3;
        }
      });

      // บันทึกไฟล์ - Format: OSM1{osm_code}_{year}.pdf หรือ OSM1_{year}.pdf (ถ้าไม่มี osm_code)
      const currentYear = new Date().getFullYear();
      const code = osmCode || "";
      doc.save(`OSM1${code}_${currentYear}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("เกิดข้อผิดพลาดในการสร้าง PDF");
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white border-b border-gray-300 p-4 mb-4">
        <button
          onClick={() => router.push("/report-osm1/data")}
          className="flex items-center gap-2 px-3 py-2 mb-3 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">กลับ</span>
        </button>
      </div>

      {/* Document style */}
      <div className="max-w-[900px] mx-auto px-4 pb-8">
        <div ref={tableRef} className="bg-white shadow-sm">
          {/* Header with Report Info and Export Button */}
          <div className="pt-8 pb-6 px-6">
            {/* Report Info - Center aligned */}
            <div className="text-center mb-6">
              <h2 className="font-bold text-black text-base mb-2">
                {isBangkok ? "แบบรายงานผลการปฏิบัติงานของ อสม. (กรุงเทพมหานคร)" : "แบบรายงานการปฏิบัติงานของ อสม."}
              </h2>
              {date && <p className="text-black text-sm mb-1">วันที่: {date}</p>}
              <p className="text-black text-sm">ชื่อ-นามสกุล: {name}</p>
            </div>

            {/* Export Button - Center */}
            <div className="flex justify-center mb-6">
              <button
                onClick={handleExportPDF}
                className="export-button flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7e32e2] to-[#9333ea] text-white font-medium rounded-lg hover:opacity-90 transition-opacity text-sm"
              >
                <Download size={16} />
                Export PDF
              </button>
            </div>

            {/* Table Header */}
            <div className="flex py-2 px-3 bg-white border-b border-t border-black">
              <div className="w-16 font-bold text-center text-black text-sm flex-shrink-0">
                ลำดับ
              </div>
              <div className="flex-1 font-bold text-center text-black text-sm">
                กิจกรรมการปฏิบัติงาน
              </div>
              <div className="w-24 font-bold text-center text-black text-sm flex-shrink-0">
                หน่วยนับ
              </div>
              <div className="w-20 font-bold text-center text-black text-sm flex-shrink-0">
                ผลงาน
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            {loading ? (
              <div className="py-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7e32e2]"></div>
                  <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
                </div>
              </div>
            ) : (
              displayData.map((row, idx) => {
                // กำหนด indent สำหรับลำดับและกิจกรรม
                let noIndent = "";
                let activityIndent = "";

                if (row.isMainCategory) {
                  // หมวดหมู่หลัก (1., 2., 3., ...)
                  noIndent = "pl-0";
                  activityIndent = "";
                } else if (row.no && (row.no.includes(".") && !row.no.startsWith("(") && row.no !== "-")) {
                  // หัวข้อย่อยระดับ 1 (1.1, 1.2, 2.1, ...)
                  noIndent = "pl-4";
                  activityIndent = "";
                } else if (row.no === "-") {
                  // หัวข้อย่อยระดับ 2 (-)
                  noIndent = "pl-6";
                  activityIndent = "";
                } else if (row.no && row.no.startsWith("(")) {
                  // หัวข้อย่อยระดับ 3 ((1), (2), (3))
                  noIndent = "pl-6";
                  activityIndent = "";
                } else if (row.no === "") {
                  // หัวข้อคำอธิบายพิเศษ
                  noIndent = "pl-4";
                  activityIndent = "";
                }

                // กำหนดขนาดตัวอักษร
                const isSubItem = row.no && (row.no.includes(".") && !row.no.startsWith("(") && row.no !== "-");
                const isLevel2 = row.no === "-";
                const isLevel3 = row.no && row.no.startsWith("(");
                const isEmptyNo = row.no === "";

                let fontSize = "";
                let noFontSize = "";

                if (row.isMainCategory) {
                  fontSize = "text-base";
                  noFontSize = "text-lg";
                } else if (isSubItem || isLevel2 || isLevel3 || isEmptyNo) {
                  fontSize = "text-sm";
                  noFontSize = "text-sm";
                } else {
                  fontSize = "text-sm";
                  noFontSize = "text-sm";
                }

                return (
                  <React.Fragment key={idx}>
                    <div className={`flex px-3 border-b border-gray-100 hover:bg-gray-50 ${row.isMainCategory ? "py-2" : "py-1.5"}`}>
                      <div className={`w-16 flex-shrink-0 ${noIndent} ${row.isMainCategory ? "font-bold" : ""} ${noFontSize} text-black`}>
                        {row.no}
                      </div>
                      <div className={`flex-1 ${row.isMainCategory ? "font-bold" : ""} ${fontSize} text-black ${activityIndent}`}>
                        {row.activity}
                      </div>
                      <div className={`w-24 text-center flex-shrink-0 ${row.isMainCategory ? "font-bold" : ""} ${fontSize} text-black`}>
                        {row.unit}
                      </div>
                      <div className={`w-20 text-center flex-shrink-0 ${row.isMainCategory ? "font-bold" : ""} ${fontSize} text-black`}>
                        {row.result !== "" && row.result !== undefined && row.result !== 0 ? row.result : ""}
                      </div>
                    </div>

                    {/* แสดงรายละเอียดข้อมูลสำหรับ Activity 9.1 (67 จังหวัด) หรือ 9.1 (กรุงเทพ) - แสดงเป็นแถวเดียว */}
                    {((!isBangkok && row.activityId === "other_activity_1") || (isBangkok && row.activityId === "smoking_cessation_1")) && smokeData.length > 0 && (
                      <div className="px-3 py-3 border-b border-gray-200">
                        <div className="pl-16">
                          {smokeData.map((item, index) => {
                            const status = item["สถานะการสูบบุหรี่"] === "smoke" ? "สูบ" : "ไม่สูบ";
                            return (
                              <div key={index} className="text-xs text-gray-600 mb-1.5">
                                <span className="font-medium">ลำดับ:</span> {index + 1}, <span className="font-medium">ชื่อ:</span> {item["ชื่อ"] || "-"}, <span className="font-medium">เบอร์โทรศัพท์:</span> {item["เบอร์โทรศัพท์"] || "-"}, <span className="font-medium">บ้านเลขที่:</span> {item["บ้านเลขที่"] || "-"}, <span className="font-medium">สถานะ:</span> {status}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reportosm1CompDetailComp;

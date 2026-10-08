import React from "react";
import { Users } from "lucide-react";
import { getUniqueUsersCount } from "@services/analyticsService";

const ReportMosquitoComp = () => {
  const [uniqueUserCount, setUniqueUserCount] = React.useState(0);

  React.useEffect(() => {
    const fetchUniqueUsers = async () => {
      try {
        const result = await getUniqueUsersCount({
          menu_type: "mosquito_larvae",
        year: new Date().getFullYear() + 543,
          month: new Date().getMonth() + 1,
        });
        setUniqueUserCount(result?.unique_users || result?.count || 0);
      } catch (error) {
        console.error("Error fetching unique users count:", error);
        setUniqueUserCount(0);
      }
    };
    fetchUniqueUsers();
  }, []);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 p-4 sm:p-6 lg:p-8">
      {/* Unique User Count Display */}
      <div className="bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl p-4 mb-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Users size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="text-white/80 text-sm">จำนวน อสม. ที่ส่งรายงานลูกน้ำยุงลาย (รายเดือน)</div>
            <div className="text-2xl font-bold text-white">
              {uniqueUserCount.toLocaleString("th-TH")} <span className="text-sm font-normal text-white/70">คน</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportMosquitoComp;

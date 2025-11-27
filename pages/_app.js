import Head from "next/head";
import "@styles/globals.css";
import { LoadingProvider } from "@context/LoadingProvider";
import { StoreProvider } from "@context/StoreProvider";
import { DateTimeProvider } from "@context/DateTimeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, Suspense } from "react";
import { FullPageLoadingSpinner } from "@components/shared/LoadingSpinner";

function MyApp({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => page);

  // สร้าง QueryClient แค่ครั้งเดียวต่อ app instance
  // ✅ OPTIMIZED: เพิ่ม cache time สำหรับรองรับ users มาก ๆ
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 30, // ✅ cache 30 นาที (เพิ่มจาก 5)
        gcTime: 1000 * 60 * 60 * 2, // ✅ เก็บไว้ใน memory 2 ชั่วโมง (เพิ่มจาก 30 นาที)
        refetchOnWindowFocus: false,
        refetchOnMount: false, // ✅ ไม่ refetch เมื่อ component mount
        refetchOnReconnect: true, // ✅ refetch เมื่อกลับมา online
        retry: 2, // ✅ เพิ่ม retry จาก 1 เป็น 2
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <DateTimeProvider>
        <LoadingProvider>
          <Head>
            <title>{process.env.NEXT_PUBLIC_APP_NAME}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta httpEquiv="Content-Language" content="th" />
            <meta name="language" content="Thai" />
            <link rel="icon" href="/logoloading.png" />
            {/* Preconnect to API domain for faster API calls */}
            <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_BASE_URL} />
            <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_BASE_URL} />
          </Head>
          <StoreProvider>
            {/* ✅ Global Suspense Boundary - จับ lazy loading ทั้งหมด */}
            <Suspense fallback={<FullPageLoadingSpinner message="กำลังโหลดแอปพลิเคชัน..." />}>
              {getLayout(<Component {...pageProps} />)}
            </Suspense>
          <style jsx global>{`
            html,
            body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              font-family: "Sarabun", sans-serif;
            }

            /* กำหนดให้ input type="datetime-local" ใช้เวลาไทย */
            input[type="datetime-local"],
            input[type="date"],
            input[type="time"] {
              font-family: "Sarabun", sans-serif;
            }

            /* ปรับการแสดงผลวันที่ให้เป็นรูปแบบไทย */
            .thai-date {
              direction: ltr;
            }

            /* Style สำหรับการแสดงเวลาแบบ real-time */
            .live-time {
              font-variant-numeric: tabular-nums;
            }
          `}</style>
        </StoreProvider>
      </LoadingProvider>
    </DateTimeProvider>
    </QueryClientProvider>
  );
}

export default MyApp;

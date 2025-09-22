import Head from "next/head";
import "@styles/globals.css";
import { LoadingProvider } from "@context/LoadingProvider";
import { StoreProvider } from "@context/StoreProvider";
import { DateTimeProvider } from "@context/DateTimeProvider";

function MyApp({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => page);

  return (
    <DateTimeProvider>
      <LoadingProvider>
        <Head>
          <title>{process.env.NEXT_PUBLIC_APP_NAME}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta httpEquiv="Content-Language" content="th" />
          <meta name="language" content="Thai" />
          <link rel="icon" href="/logoloading.png" />
        </Head>
        <StoreProvider>
          {getLayout(<Component {...pageProps} />)}
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
  );
}

export default MyApp;

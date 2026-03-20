// External registration URL (หน้าลงทะเบียนหลัก)
const EXTERNAL_REGISTER_URL = "https://phc-management.hss.moph.go.th/register";

export async function getServerSideProps(context) {
  const { query, req } = context;

  // Build redirect URL with parameters
  const redirectUrl = new URL(EXTERNAL_REGISTER_URL);

  // Get the host from request headers
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  const currentOrigin = `${protocol}://${host}`;

  // Add returnUrl parameter
  redirectUrl.searchParams.set("returnUrl", currentOrigin);

  // Forward all query parameters (source, user_type, citizen_id, first_name, last_name, etc.)
  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      redirectUrl.searchParams.set(key, value);
    }
  });

  // Server-side redirect - user won't see intermediate URL
  return {
    redirect: {
      destination: redirectUrl.toString(),
      permanent: false,
    },
  };
}

// This component will never render due to server-side redirect
export default function RegisterPage() {
  return null;
}

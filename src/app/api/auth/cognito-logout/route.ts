import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const domain = process.env.COGNITO_HOSTED_DOMAIN!;   // 例如 https://us-east-18vll3jki2.auth.us-east-1.amazoncognito.com
  const clientId = process.env.COGNITO_CLIENT_ID!;
  const base = process.env.NEXTAUTH_URL!.replace(/\/$/, "");

  // 可选：允许 ?returnTo=/somewhere 覆盖回跳
  const returnTo = req.nextUrl.searchParams.get("returnTo") ?? "/";
  const url = new URL(`${domain.replace(/\/$/, "")}/logout`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("logout_uri", `${base}${returnTo}`); // 必须在 Allowed sign-out URLs 里

  return NextResponse.redirect(url.toString(), { status: 302 });
}

 import type { NextAuthOptions } from "next-auth";
import Cognito from "next-auth/providers/cognito";

const ISSUER = process.env.COGNITO_ISSUER!.replace(/\/$/, "");
const HOSTED = process.env.COGNITO_HOSTED_DOMAIN!.replace(/\/$/, "");

export const authOptions: NextAuthOptions = {
  providers: [
    Cognito({
      // ① 发现/验签 用“用户池 Issuer”
      issuer: ISSUER,
      wellKnown: `${ISSUER}/.well-known/openid-configuration`,

      // ② 授权/换票/用户信息 用 Hosted UI 域
      authorization: {
        url: `${HOSTED}/oauth2/authorize`,
        params: { scope: "openid email phone" },
      },
      token: `${HOSTED}/oauth2/token`,
      userinfo: `${HOSTED}/oauth2/userInfo`, // 注意 I 大写

      // ③ 机密客户端凭据
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      // 若遇到 401 可以尝试改为 POST 认证方式（通常不需要）：
      // client: { token_endpoint_auth_method: "client_secret_post" } as any,
    }),
  ],
  session: { strategy: "jwt" },
  debug: process.env.NEXTAUTH_DEBUG === "true",
};

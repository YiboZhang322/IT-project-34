"use client";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: s, status } = useSession();

  // 再登录时强制显示 AWS 登录页
  const forceCognitoLogin = () =>
    signIn("cognito", { callbackUrl: "/", prompt: "login" });

  // 先清 NextAuth，会话；再 302 到 Cognito /logout 清 Hosted UI 会话
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.href = "/api/auth/cognito-logout?returnTo=/";
  };

  if (status === "loading") return <main className="p-8">Loading…</main>;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-2xl shadow p-6 bg-white space-y-4">
        <h1 className="text-2xl font-semibold">Go Planner</h1>
        {s ? (
          <>
            <p>Signed in as <b>{s.user?.email ?? s.user?.name}</b></p>
            <button className="w-full rounded-lg px-4 py-2 bg-gray-900 text-white"
                    onClick={handleSignOut}>Sign out</button>
          </>
        ) : (
          <>
            <p>You are not signed in.</p>
            <button className="w-full rounded-lg px-4 py-2 bg-gray-900 text-white"
                    onClick={forceCognitoLogin}>Sign in with Cognito</button>
          </>
        )}
      </div>
    </main>
  );
}

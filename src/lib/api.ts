// lib/api.ts
import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!; // 例如 https://api.example.com

export async function apiFetch(path: string, init: RequestInit = {}) {
  const session = await fetchAuthSession();
  const idToken = session.tokens?.idToken?.toString();

  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  if (idToken) headers.set('Authorization', `Bearer ${idToken}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers, mode: 'cors' });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

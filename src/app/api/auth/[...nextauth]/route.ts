// src/app/api/auth/[...nextauth]/route.ts
export const runtime = 'experimental-edge';
import { handlers } from "@/auth";
export const { GET, POST } = handlers;

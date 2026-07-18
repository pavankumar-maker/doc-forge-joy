import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listStaticQrs from "./tools/list_static_qrs";
import createStaticQr from "./tools/create_static_qr";
import deleteQr from "./tools/delete_qr";
import listDynamicQrs from "./tools/list_dynamic_qrs";
import createMultilinkQr from "./tools/create_multilink_qr";
import createVcardQr from "./tools/create_vcard_qr";
import getScanStats from "./tools/get_scan_stats";
import getProfile from "./tools/get_profile";

// Supabase discovery issuer must be the direct supabase.co host, not the
// managed .lovable.cloud proxy. VITE_SUPABASE_PROJECT_ID is inlined by Vite
// at build time. The fallback keeps the issuer well-formed during manifest
// extraction; real tokens never verify against the sentinel.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "uniqr-mcp",
  title: "UniQR",
  version: "0.1.0",
  instructions:
    "Tools for the UniQR QR platform. Read and manage the signed-in user's static QR codes, dynamic QR codes (file uploads, Multi-Link pages, Digital Business Cards), scan analytics, and profile. All tools act as the authenticated user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listStaticQrs,
    createStaticQr,
    listDynamicQrs,
    createMultilinkQr,
    createVcardQr,
    getScanStats,
    deleteQr,
    getProfile,
  ],
});
import type { ReactNode } from "react";
import AdminBasicAuthProvider from "@/app/admin/AdminBasicAuthProvider";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminBasicAuthProvider>{children}</AdminBasicAuthProvider>;
}


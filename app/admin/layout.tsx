import type { Metadata } from "next";
import AdminLayoutClient from "./admin-layout-client";

export const metadata: Metadata = {
  title: "COSMOS-ITS - Admin Panel",
  description: "COSMOS-ITS Admin Panel provides comprehensive tools for managing courses, questions, agents, and system settings in the COSMOS-ITS university tutoring system.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}

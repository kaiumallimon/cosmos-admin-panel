import type { Metadata } from "next";
import UserLayoutClient from "./user-layout-client";

export const metadata: Metadata = {
  title: "COSMOS-ITS - Student Portal",
  description: "Access your personalized dashboard, AI assistant, performance insights, and official notices in the COSMOS-ITS student portal.",
};

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <UserLayoutClient>{children}</UserLayoutClient>;
}

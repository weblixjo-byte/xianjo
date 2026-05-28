import type { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/manifest-admin.json",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/OG-IMG.png",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

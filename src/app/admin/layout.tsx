import type { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/manifest-admin.json",
  icons: {
    icon: "/OG-IMG.png",
    shortcut: "/OG-IMG.png",
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

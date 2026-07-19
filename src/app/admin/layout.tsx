import AnnouncementBanner from "@/components/AnnouncementBanner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AnnouncementBanner scope="admins" />
      {children}
    </div>
  );
}

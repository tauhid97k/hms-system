import { NotificationProvider } from "@/providers/notification-provider";
import { SidebarProvider } from "@/providers/sidebar-provider";
import Header from "./_components/header";
import Notification from "./_components/notification";
import Sidebar from "./_components/sidebar";

const DashboardLayout = ({ children }: LayoutProps<"/dashboard">) => {
  return (
    <NotificationProvider>
      <SidebarProvider>
        <div className="fixed flex size-full">
          <Sidebar />
          <div className="flex w-full flex-col overflow-hidden">
            <Header />
            <main className="grow overflow-y-auto bg-zinc-50 p-6 dark:bg-background">
              {children}
            </main>
            <Notification />
          </div>
        </div>
      </SidebarProvider>
    </NotificationProvider>
  );
};

export default DashboardLayout;

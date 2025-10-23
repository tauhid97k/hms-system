import { SidebarProvider } from "@/providers/sidebar-provider";
import Header from "./_components/header";
import Sidebar from "./_components/sidebar";

const DashboardLayout = ({ children }: LayoutProps<"/dashboard">) => {
  return (
    <SidebarProvider>
      <div className="fixed flex size-full">
        <Sidebar />
        <div className="flex w-full flex-col overflow-hidden">
          <Header />
          <main className="grow overflow-y-auto bg-zinc-50 p-6 dark:bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;

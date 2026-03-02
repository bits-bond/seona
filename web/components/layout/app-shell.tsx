"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { TopNavbar } from "./top-navbar";
import { PageHeader, type PageHeaderProps } from "./page-header";
import type { BreadcrumbItem } from "./breadcrumbs";

const SIDEBAR_STORAGE_KEY = "sidebar-collapsed";
const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 64;
const SIDEBAR_MARGIN = 12; // matches the sidebar's top/left/bottom margin

export interface AppShellProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  pageTitle?: string;
  pageDescription?: string;
  pageActions?: React.ReactNode;
  className?: string;
}

export function AppShell({
  children,
  breadcrumbs,
  pageTitle,
  pageDescription,
  pageActions,
  className,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === "true") setCollapsed(true);

    // Listen for sidebar collapse changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === SIDEBAR_STORAGE_KEY) {
        setCollapsed(e.newValue === "true");
      }
    };
    window.addEventListener("storage", handleStorage);

    // Also poll for same-tab localStorage changes (StorageEvent only fires cross-tab)
    const interval = setInterval(() => {
      const current = localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
      setCollapsed((prev) => (prev !== current ? current : prev));
    }, 200);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  const sidebarOffset = mounted
    ? (collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED) + SIDEBAR_MARGIN
    : SIDEBAR_WIDTH_EXPANDED + SIDEBAR_MARGIN;

  return (
    <div className="min-h-screen bg-default-50">
      <Sidebar />

      <div
        className={cn(
          "transition-[margin-left] duration-200 ease-in-out",
          "md:ml-[272px]" // default fallback before JS hydration
        )}
        style={mounted ? { marginLeft: `${sidebarOffset}px` } : undefined}
      >
        <TopNavbar
          breadcrumbs={breadcrumbs}
          sidebarWidth={sidebarOffset}
        />

        <main className={cn("p-4 md:p-6", className)}>
          {pageTitle && (
            <PageHeader
              title={pageTitle}
              description={pageDescription}
              actions={pageActions}
            />
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

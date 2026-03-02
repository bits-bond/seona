"use client";

import { Button } from "@heroui/react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Breadcrumbs, type BreadcrumbItem } from "./breadcrumbs";
import { ThemeToggle } from "./theme-toggle";

export interface TopNavbarProps {
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
  sidebarWidth?: number;
}

export function TopNavbar({ breadcrumbs, className, sidebarWidth = 260 }: TopNavbarProps) {
  const openMobileSidebar = () => {
    window.dispatchEvent(new CustomEvent("sidebar-mobile-open"));
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-6",
        "bg-background/80 backdrop-blur-md border-b border-default-200",
        className
      )}
      style={{
        marginLeft: undefined, // handled by parent container
      }}
    >
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <Button
          isIconOnly
          variant="light"
          size="sm"
          className="md:hidden"
          onPress={openMobileSidebar}
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs items={breadcrumbs} />
        )}
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}

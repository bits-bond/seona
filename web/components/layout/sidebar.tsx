"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@heroui/react";
import {
  LayoutDashboard,
  FolderOpen,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarProjectList } from "./sidebar-project-list";

const STORAGE_KEY = "sidebar-collapsed";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderOpen },
  { label: "AEO", href: "/aeo", icon: Sparkles },
  { label: "New Audit", href: "/new-audit", icon: PlusCircle },
];

export interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  // Listen for mobile open event from navbar hamburger
  useEffect(() => {
    const handler = () => setMobileOpen(true);
    window.addEventListener("sidebar-mobile-open", handler);
    return () => window.removeEventListener("sidebar-mobile-open", handler);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mobileOpen, closeMobile]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-2 px-4 h-14 shrink-0",
          collapsed && "justify-center px-0",
        )}
      >
        <span className="font-semibold text-default-900 text-md whitespace-nowrap">
          SEONA
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-0.5 px-2 mt-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-default-600 hover:bg-default-100 hover:text-default-900",
                collapsed && "justify-center px-0",
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 my-3 border-t border-default-200" />

      {/* Projects Section */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!collapsed && (
          <p className="px-4 mb-2 text-xs font-medium text-default-400 uppercase tracking-wider">
            Projects
          </p>
        )}
        <SidebarProjectList collapsed={collapsed} />
      </div>

      {/* Collapse Toggle */}
      <div
        className={cn(
          "shrink-0 p-2 border-t border-default-200",
          collapsed ? "flex justify-center" : "flex justify-end",
        )}
      >
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          onPress={toggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col fixed top-3 left-3 bottom-3 z-40",
          "bg-background/80 backdrop-blur-xl border border-default-200 rounded-2xl shadow-lg",
          "transition-[width] duration-200 ease-in-out overflow-hidden",
          collapsed ? "w-16" : "w-[260px]",
          className,
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Overlay Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 w-[280px] md:hidden",
          "bg-background border-r border-default-200 shadow-2xl",
          "transition-transform duration-200 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-end p-2">
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            onPress={closeMobile}
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        {sidebarContent}
      </aside>
    </>
  );
}

// Export a hook for other components to trigger mobile sidebar
export function useSidebarMobileToggle() {
  // We use a custom event to communicate between navbar hamburger and sidebar
  const open = () =>
    window.dispatchEvent(new CustomEvent("sidebar-mobile-open"));
  return { open };
}

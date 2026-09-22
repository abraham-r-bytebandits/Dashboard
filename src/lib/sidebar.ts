// src/lib/sidebar.ts
import {
  Home,
  Users,
  Settings,
  TrendingUp,
  BarChart,
  Briefcase,
  Kanban,
  CreditCard,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import type { AppPagePermission } from "@/types"

export type NavSubItem = {
  title: string
  url: string
  pageKey?: AppPagePermission
  roles?: string[]
}

export type NavMainItem = {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  pageKey?: AppPagePermission
  isAdminOnly?: boolean
  items?: NavSubItem[]
}

export const data = {
  teams: [
    {
      name: "Sales Team",
      logo: TrendingUp,
      plan: "Enterprise",
    },
    {
      name: "Marketing Team",
      logo: BarChart,
      plan: "Pro",
    },
    {
      name: "Support Team",
      logo: Users,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
      pageKey: "dashboard" as AppPagePermission,
      isActive: true,
    },
    {
      title: "Work & Priorities",
      url: "#",
      icon: Kanban,
      items: [
        {
          title: "Status Board",
          url: "/work/status-board",
          pageKey: "status-board" as AppPagePermission,
        },
        {
          title: "Impact Board",
          url: "/work/impact-board",
          pageKey: "impact-board" as AppPagePermission,
        },
        {
          title: "Create Assessment",
          url: "/work/create",
          pageKey: "create-assessment" as AppPagePermission,
          roles: ["ADMIN", "SUPER_ADMIN", "MANAGER"],
        },
      ],
    },
    {
      title: "Clients",
      url: "/clients",
      icon: Briefcase,
      pageKey: "clients" as AppPagePermission,
    },
    {
      title: "Finances",
      url: "#",
      icon: CreditCard,
      items: [
        {
          title: "Invoices",
          url: "/invoices",
          pageKey: "invoices" as AppPagePermission,
        },
        {
          title: "Fixed Costs",
          url: "/add-fixed-cost",
          pageKey: "fixed-costs" as AppPagePermission,
        },
        {
          title: "Operational Costs",
          url: "/add-operational-cost",
          pageKey: "operational-costs" as AppPagePermission,
        },
      ],
    },
    {
      title: "Users",
      url: "#",
      icon: Users,
      isAdminOnly: true,
      items: [
        {
          title: "User Management",
          url: "/admin/users",
          pageKey: "user-management" as AppPagePermission,
        },
        {
          title: "User Permissions",
          url: "/admin/permissions",
          pageKey: "user-management" as AppPagePermission,
        },
        {
          title: "Functional Roles",
          url: "/admin/roles",
          pageKey: "user-management" as AppPagePermission,
        },
      ],
    },
    {
      title: "Tools",
      url: "#",
      icon: Wrench,
      items: [
        {
          title: "Image Converter",
          url: "/image-converter",
          pageKey: "image-converter" as AppPagePermission,
        },
        {
          title: "Site Management",
          url: "/admin/sites",
          pageKey: "site-management" as AppPagePermission,
        },
        {
          title: "Contact Messages",
          url: "/admin/contacts",
          pageKey: "contact-messages" as AppPagePermission,
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings,
      items: [
        {
          title: "Profile & Account",
          url: "/settings",
        },
      ],
    },
  ],
}
// src/lib/sidebar.ts
import {
  Home,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  Settings,
  Tag,
  FileText,
  HelpCircle,
  TrendingUp,
  BarChart,
} from "lucide-react"

export const data = {
  user: {
    name: "John Doe",
    email: "john@example.com",
    avatar: "/avatars/john.jpg",
  },
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
      title: "Overview",
      url: "#",
      icon: Home,
      isActive: true,
      items: [
        {
          title: "Dashboard",
          url: "#",
        },
        {
          title: "Analytics",
          url: "#",
        },
        {
          title: "Reports",
          url: "#",
        },
      ],
    },
    {
      title: "Orders",
      url: "#",
      icon: ShoppingCart,
      items: [
        {
          title: "All Orders",
          url: "#",
        },
        {
          title: "Pending",
          url: "#",
        },
        {
          title: "Completed",
          url: "#",
        },
        {
          title: "Refunded",
          url: "#",
        },
      ],
    },
    {
      title: "Customers",
      url: "#",
      icon: Users,
      items: [
        {
          title: "Customer List",
          url: "#",
        },
        {
          title: "Segments",
          url: "#",
        },
        {
          title: "Reviews",
          url: "#",
        },
      ],
    },
    {
      title: "Products",
      url: "#",
      icon: Package,
      items: [
        {
          title: "Inventory",
          url: "#",
        },
        {
          title: "Categories",
          url: "#",
        },
        {
          title: "Collections",
          url: "#",
        },
      ],
    },
    {
      title: "Finances",
      url: "#",
      icon: DollarSign,
      items: [
        {
          title: "Revenue",
          url: "#",
        },
        {
          title: "Transactions",
          url: "#",
        },
        {
          title: "Taxes",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Payment",
          url: "#",
        },
        {
          title: "Shipping",
          url: "#",
        },
        {
          title: "Notifications",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Discounts",
      url: "#",
      icon: Tag,
    },
    {
      name: "Invoices",
      url: "#",
      icon: FileText,
    },
    {
      name: "Support",
      url: "#",
      icon: HelpCircle,
    },
  ],
}
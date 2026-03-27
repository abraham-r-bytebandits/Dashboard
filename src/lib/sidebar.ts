// src/lib/sidebar.ts
import {
  Home,
  ShoppingCart,
  Users,
  Settings,
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
      title: "Dashboard",
      url: "/",
      icon: Home,
      isActive: true,
    },
    {
      title: "Fixed Costs",
      url: "#",
      icon: ShoppingCart,
      items: [
        {
          title: "Add Fixed Cost",
          url: "/add-fixed-cost",
        },
        {
          title: "Edit Fixed Cost",
          url: "#",
        },
      ],
    },
    {
      title: "Operational Costs",
      url: "#",
      icon: Users,
      items: [
        {
          title: "Add Operational Cost",
          url: "/add-operational-cost",
        },
        {
          title: "Edit Operational Cost",
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
}
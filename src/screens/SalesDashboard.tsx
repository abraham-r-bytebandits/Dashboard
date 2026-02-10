// src/screens/SalesDashboard.tsx
import { Plus, DollarSign, CircleUser, FolderClosed, Handbag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfigProvider } from 'antd';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import 'antd/dist/reset.css';
import { DashboardCard } from '@/components/Dashboard/DashboardCard';
import { ChartBarInteractive } from "@/components/chart/BarChart"
import { ChartBarHorizontal } from '@/components/chart/HorizontalBarChart';
import DashboardTable from '@/components/table/DashboardTable';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { DatePickerWithRange } from '@/components/DatePickerWithRange';
import { ClockFading } from "lucide-react"

const SalesDashboard = () => {
    const cards = [
        {
            title: "Total Sales",
            value: "$24,580",
            change: "+12.5%",
            isPositive: true,
            icon: <DollarSign className="h-5 w-5" />,
            iconBg: "bg-green-50",
            iconTextColor: "text-green-600",
            link: "View net earnings"
        },
        {
            title: "Revenue",
            value: "$18,250",
            change: "+8.2%",
            isPositive: true,
            icon: <Handbag className="h-5 w-5" />,
            iconBg: "bg-blue-50",
            iconTextColor: "text-blue-400",
            link: "View all orders"
        },
        {
            title: "Customers",
            value: "1,248",
            change: "+5.7%",
            isPositive: true,
            icon: <CircleUser className="h-5 w-5" />,
            iconBg: "bg-yellow-50",
            iconTextColor: "text-yellow-500",
            link: "See details"
        },
        {
            title: "Orders",
            value: "342",
            change: "-2.3%",
            isPositive: false,
            icon: <FolderClosed className="h-5 w-5" />,
            iconBg: "bg-gray-100",
            iconTextColor: "text-gray-600",
            link: "View all Refunds"
        },
    ];

    return (
        <div className="space-y-2 relative">
            <div className='bg-white'>
                <div className="p-2">
                    <SidebarTrigger />
                </div>
                <Separator />
                <div className="flex flex-col p-4 md:p-6 sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {/* Profile Image */}
                        <Avatar className="h-20 w-20 rounded-full">
                            <AvatarImage src="/avatars/john.jpg" alt="John Doe" />
                            <AvatarFallback>JD</AvatarFallback>
                        </Avatar>

                        <div>
                            <div className="flex items-center">
                                <h1 className="text-[30px] font-extrabold">Welcome back, John</h1>
                            </div>
                            <p className="text-[#64748B] text-sm">
                                Here's what's happening with your store today.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {/* Date Picker with Input */}
                        <div className="flex">
                            <DatePickerWithRange />
                        </div>

                        {/* Add Product Button */}
                        <Button
                            size="sm"
                            className="h-9 bg-[#405189] !text-[#ffffff] hover:bg-[#304179]"
                        >
                            <Plus className="h-3 w-3" />
                            Add Product
                        </Button>
                    </div>
                </div>
            </div>
            <div className='p-6'>
                {/* Cards Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {cards.map((card, index) => (
                        <DashboardCard key={index} {...card} />
                    ))}
                </div>

                {/* Main Chart - Full width */}
                <div className="my-6 md:my-8 bg-white rounded-xl">
                    <div className='px-0'>
                        <div className="flex flex-row items-center gap-2 p-3">
                            <ClockFading className="h-5 w-5 text-muted-foreground" />
                            <h2 className="text-base font-semibold">
                                Recent Orders
                            </h2>
                        </div>

                        <div>
                            <ChartBarInteractive />
                        </div>
                    </div>
                </div>

                <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <ConfigProvider
                                theme={{
                                    components: {
                                        Table: {
                                            fontSize: 14,
                                            padding: 8,
                                            paddingContentVerticalLG: 12,
                                            paddingContentHorizontalLG: 16,
                                        },
                                        Card: {
                                            paddingLG: 24,
                                            paddingSM: 16,
                                        },
                                        Pagination: {
                                            colorPrimary: '#2BD0EA',
                                            colorPrimaryHover: '#1DA1C1',
                                        }
                                    },
                                }}
                            >
                                <DashboardTable />
                            </ConfigProvider>
                        </div>
                        <ChartBarHorizontal />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesDashboard;
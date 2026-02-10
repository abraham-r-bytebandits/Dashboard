// src/screens/SalesDashboard.tsx
import { Plus, DollarSign, Users, ShoppingBag, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfigProvider, DatePicker } from 'antd';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import 'antd/dist/reset.css';
import { DashboardCard } from '@/components/Dashboard/DashboardCard';
import { ChartBarInteractive } from "@/components/chart/BarChart"
import { ChartBarHorizontal } from '@/components/chart/HorizontalBarChart';
import DashboardTable from '@/components/table/DashboardTable';
import { SidebarTrigger } from '@/components/ui/sidebar';


const SalesDashboard = () => {
    const cards = [
        {
            title: "Total Sales",
            value: "$24,580",
            change: "+12.5%",
            isPositive: true,
            icon: <DollarSign className="h-5 w-5" />,
            iconBg: "bg-blue-50",
            iconTextColor: "text-blue-600",
        },
        {
            title: "Revenue",
            value: "$18,250",
            change: "+8.2%",
            isPositive: true,
            icon: <BarChart className="h-5 w-5" />,
            iconBg: "bg-green-50",
            iconTextColor: "text-green-600",
        },
        {
            title: "Customers",
            value: "1,248",
            change: "+5.7%",
            isPositive: true,
            icon: <Users className="h-5 w-5" />,
            iconBg: "bg-yellow-50",
            iconTextColor: "text-yellow-600",
        },
        {
            title: "Orders",
            value: "342",
            change: "-2.3%",
            isPositive: false,
            icon: <ShoppingBag className="h-5 w-5" />,
            iconBg: "bg-rose-50",
            iconTextColor: "text-rose-600",
        },
    ];

    return (
        <div className="p-6 space-y-6 relative">
            <div className="absolute top-2 left-2 z-10">
                <SidebarTrigger />
            </div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {/* Profile Image */}
                    <Avatar className="h-20 w-20 rounded-full">
                        <AvatarImage src="/avatars/john.jpg" alt="John Doe" />
                        <AvatarFallback>JD</AvatarFallback>
                    </Avatar>

                    <div>
                        <div className="flex items-center">
                            <h1 className="text-4xl font-extrabold">Welcome back, John</h1>
                        </div>
                        <p className="text-gray-500 text-sm">
                            Here's what's happening with your store today.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Date Picker with Input */}
                    <div className="flex">
                        <DatePicker
                            className="h-9 rounded-r-none border-r-0"
                            style={{ width: '200px' }}
                            placeholder="Select date"
                            format="MMM DD, YYYY"
                        />
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

            {/* Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {cards.map((card, index) => (
                    <DashboardCard key={index} {...card} />
                ))}
            </div>

            {/* Main Chart - Full width */}
            <div className="mb-6 md:mb-8">
                <ChartBarInteractive />
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
    );
};

export default SalesDashboard;

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="h-full flex flex-col">
        <div className="w-full h-full">
            <DashboardTable />
        </div>
    </div>
    <div className="h-full flex flex-col">
        <div className="flex-1 min-w-0">
            <ChartBarHorizontal />
        </div>
    </div>
</div>
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfigProvider } from 'antd';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import 'antd/dist/reset.css';
import { ChartBarInteractive } from "@/components/chart/BarChart"
import { ChartBarHorizontal } from '@/components/chart/HorizontalBarChart';
import DashboardTable from '@/components/table/DashboardTable';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { DatePickerWithRange } from '@/components/DatePickerWithRange';
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SearchOutlined } from "@ant-design/icons"



const StatBox = ({
    title,
    value,
    btnLabel,
    btnColor,
    btnTextColor = 'white',
}: {
    title: string;
    value: number;
    btnLabel: string;
    btnColor: string;
    btnTextColor?: string;
}) => {
    const isGreen = title.toLowerCase().includes('client');
    return (
        <div className="bg-white rounded-xl border border-gray-100 px-5 py-5 flex flex-col items-center justify-between gap-4 shadow-sm h-full">
            <span className={`text-sm font-medium ${isGreen ? 'text-green-500' : 'text-red-400'}`}>
                {title}
            </span>
            <span className="text-4xl font-extrabold text-gray-900">{value}</span>
            <button
                className="w-full py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: btnColor, color: btnTextColor }}
            >
                {btnLabel}
            </button>
        </div>
    );
};

const SummaryCard = ({
    title,
    value,
    change,
    isPositive,
}: {
    title: string;
    value: string;
    change: string;
    isPositive: boolean;
}) => (
    <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col justify-between gap-3">
        <p className="text-sm text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <div className="inline-flex items-center gap-1.5">
            <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${isPositive ? 'bg-[#EAF7F0] text-emerald-600' : 'bg-[#FDEDEE] text-rose-500'
                    }`}
            >
                {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                ) : (
                    <TrendingDown className="h-3 w-3" />
                )}
                {change}
            </span>
            <span className="text-xs text-gray-400">Compared to last month</span>
        </div>
    </div>
);

const FinancialDashboard = () => {
    return (
        <div className="space-y-2 relative">
            <div className='bg-white'>
                <div className='flex items-center gap-4'>
                    <div className="p-2">
                        <SidebarTrigger />
                    </div>
                    <Field orientation="horizontal" className="max-w-[400px]">
                        <div className="relative w-full">
                            <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <Input
                                type="search"
                                placeholder="Search here..."
                                className="pl-10 border-none"
                            />
                        </div>
                    </Field>
                </div>
            </div>

            <div className="flex flex-col p-4 md:p-6 sm:flex-row sm:items-center justify-between gap-4 bg-white m-4 rounded-xl">
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 rounded-full">
                        <AvatarImage src="/avatars/john.jpg" alt="User" />
                        <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <h1 className="text-[28px] font-extrabold text-gray-900">
                        Welcome back, {'{name}'}!
                    </h1>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <DatePickerWithRange />
                    <Button
                        size="sm"
                        className="h-9 bg-[#405189] !text-white hover:bg-[#304179]"
                    >
                        <Plus className="h-3 w-3" />
                        Add Product
                    </Button>
                </div>
            </div>

            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-4 bg-white rounded-xl border border-gray-100 p-8 shadow-sm flex flex-col justify-between gap-4 h-full">
                        <p className="text-sm text-gray-500">Account Balance</p>
                        <h2 className="text-4xl font-bold text-gray-900 tracking-tight">₹45,632.67</h2>
                        <div className="inline-flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-[#EAF7F0] text-emerald-600">
                                <TrendingUp className="h-3 w-3" />
                                + ₹51,700
                            </span>
                            <span className="text-xs text-gray-400">(increased) by last month</span>
                        </div>
                    </div>

                    <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <SummaryCard title="Total Revenue" value="₹45,632.67" change="↑ 16.5%" isPositive />
                        <SummaryCard title="Total Expense" value="₹45,632.67" change="↓ 16.5%" isPositive={false} />
                        <SummaryCard title="Profit / Loss" value="₹45,632.67" change="↑ 16.5%" isPositive />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-4 space-y-4">
                        <ChartBarHorizontal />

                        <div className="grid grid-cols-2 gap-4">
                            <StatBox title="Total clients" value={15} btnLabel="View" btnColor="#F9B610" btnTextColor="black" />
                            <StatBox title="Pending Dues" value={15} btnLabel="Pay" btnColor="#0157FF" btnTextColor="white" />
                        </div>
                    </div>

                    <div className="lg:col-span-8 bg-white rounded-xl">
                        <ChartBarInteractive />
                    </div>
                </div>

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
                            },
                        },
                    }}
                >
                    <DashboardTable />
                </ConfigProvider>
            </div>
        </div>
    );
};

export default FinancialDashboard;
import { TrendingUp, TrendingDown, Bell, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ConfigProvider } from 'antd';
import 'antd/dist/reset.css';
import { ChartBarHorizontal } from '@/components/chart/HorizontalBarChart';
import DashboardTable from '@/components/table/DashboardTable';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { DatePickerWithRange } from '@/components/DatePickerWithRange';
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SearchOutlined } from "@ant-design/icons"
import { useEffect, useState } from 'react';
import api from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import ResponsiveSidebar from '@/components/Sidebar/ResponsiveSidebar';
import SpendBreakdown from '@/components/chart/SpendBreakdownChart';
import TotalExpenseChart from '@/components/chart/TotalExpenseChart';
import { ThunderboltOutlined } from '@ant-design/icons';

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
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full">
        <div>
            <p className="text-sm font-medium text-[#000000] mb-2">{title}</p>
            <h3 className="text-2xl font-bold text-[#000000] mb-2">{value}</h3>
        </div>

        <div className="flex justify-between mt-4">
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
            <a
                href="#"
                className="text-xs text-[#0157FF] underline hover:no-underline transition-colors"
                onClick={(e) => {
                    e.preventDefault();
                    console.log(`View details for ${title}`);
                }}
            >
                View more details
            </a>
        </div>
    </div>
);

const FinancialDashboard = () => {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<any>(null);
    const [contributions, setContributions] = useState<any[]>([]);
    const [chartDataPayload, setChartDataPayload] = useState<any>(null);

    // Default open on XL+ screens, closed on smaller screens
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 2880;
        }
        return false;
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [
                    overviewRes,
                    contributionsRes,
                    chartDataRes
                ] = await Promise.all([
                    api.get('/dashboard/overview').catch(() => ({ data: { success: false } })),
                    api.get('/dashboard/contributions').catch(() => ({ data: { success: false } })),
                    api.get('/dashboard/chart-data').catch(() => ({ data: { success: false } }))
                ]);

                if (overviewRes.data?.success || overviewRes.data) setOverview(overviewRes.data?.data || overviewRes.data);
                if (contributionsRes.data?.success || contributionsRes.data) setContributions(contributionsRes.data?.data || contributionsRes.data || []);
                if (chartDataRes.data?.success || chartDataRes.data) setChartDataPayload(chartDataRes.data?.data || chartDataRes.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Handle window resize to maintain sidebar state
    useEffect(() => {
        const handleResize = () => {
            const isXlScreen = window.innerWidth >= 1700;
            if (isXlScreen && !sidebarOpen) {
                // Auto-open sidebar when switching to XL screen if it was closed
                setSidebarOpen(true);
            } else if (!isXlScreen && sidebarOpen) {
                // Close sidebar when switching to smaller screen if it was open
                setSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [sidebarOpen]);

    if (loading) {
        return <div className="flex h-screen w-full items-center justify-center text-gray-500 font-medium">Loading Dashboard Data...</div>;
    }

    return (
        <div className="flex w-full min-h-screen bg-[#F3F3F9]">
            {/* Main Content Area */}
            <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'xl:mr-[250px]' : ''}`}>
                <div className="space-y-2 relative overflow-x-hidden">
                    <div className='bg-white'>
                        <div className='flex items-center justify-between gap-4'>
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

                            <div className='flex items-center gap-6'>
                                <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                                    <Bell className="h-5 w-5" />
                                    <span className="text-sm font-medium">Notifications</span>
                                </button>

                                <div className='bg-[#F3F3F9] flex items-center gap-4 px-4 py-2'>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={user?.profile?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.profile?.firstName || 'User')}&background=F9B610&color=fff`} alt={user?.profile?.firstName || 'User'} />
                                            <AvatarFallback className="bg-amber-400 text-white text-sm font-semibold">
                                                {user?.profile?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-[#405189]">{user?.profile?.firstName || 'User'}</span>
                                        </div>
                                    </div>

                                    <div className="h-6 w-px bg-gray-300" />

                                    <button
                                        onClick={logout}
                                        className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span className="text-sm font-medium">Log out</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className=''>
                        <div className="flex flex-col px-4 md:px-6 p-4 md:p-6 sm:flex-row sm:items-center justify-between gap-4 bg-white m-8 rounded-xl">
                            <div className="flex items-center justify-center gap-4">
                                <h1 className="text-[32px] font-extrabold text-[#000000]">
                                    Expenditure Control Center
                                </h1>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <DatePickerWithRange />
                                <Button
                                    size="sm"
                                    className="h-9 bg-[#405189] !text-white hover:bg-[#405189]"
                                    onClick={() => setSidebarOpen((prev) => !prev)}
                                >
                                    {sidebarOpen ? <ThunderboltOutlined /> : <ThunderboltOutlined />}
                                </Button>
                            </div>
                        </div>

                        <div className="px-8 space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                <div className="lg:col-span-4 bg-white rounded-xl border border-gray-100 p-6 shadow-sm h-full flex flex-col">
                                    <div className="flex justify-between items-start mb-3">
                                        <p className="text-sm text-[#000000]">Total Expenditure</p>
                                        {(() => {
                                            const changeStr = overview?.expenditureChange !== undefined ? `${overview.expenditureChange}%` : "+ 0%";
                                            const isPositive = !String(changeStr).includes('-');
                                            return (
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${isPositive ? 'bg-[#EAF7F0] text-emerald-600' : 'bg-[#FDEDEE] text-rose-500'}`}>
                                                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                    {changeStr}
                                                </span>
                                            );
                                        })()}
                                    </div>

                                    <div className="mt-auto">
                                        <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
                                            ₹{(overview?.totalExpenditure || 0).toLocaleString()}
                                        </h2>
                                    </div>
                                </div>

                                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <SummaryCard
                                        title="Fixed Costs"
                                        value={`₹${(overview?.fixedCosts || 0).toLocaleString()}`}
                                        change={overview?.fixedCostsChange !== undefined ? `${overview.fixedCostsChange}%` : "0%"}
                                        isPositive={!String(overview?.fixedCostsChange || "0").includes('-')}
                                    />
                                    <SummaryCard
                                        title="Operational Costs"
                                        value={`₹${(overview?.operationalCosts || 0).toLocaleString()}`}
                                        change={overview?.operationalCostsChange !== undefined ? `${overview.operationalCostsChange}%` : "0%"}
                                        isPositive={!String(overview?.operationalCostsChange || "0").includes('-')}
                                    />
                                    <ChartBarHorizontal data={contributions} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                <div className="lg:col-span-4 space-y-4">
                                    <SpendBreakdown data={chartDataPayload?.pieChartData} />
                                </div>

                                <div className="lg:col-span-8 bg-white rounded-xl">
                                    <TotalExpenseChart data={chartDataPayload?.barChartData} />
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
                </div>
            </div>

            {/* Responsive Sidebar (Right side) */}
            <ResponsiveSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>
    );
};

export default FinancialDashboard;
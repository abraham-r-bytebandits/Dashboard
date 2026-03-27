'use client';
import { useState, useEffect } from 'react';
import { Card, Table, Pagination } from 'antd';
import { getColumns } from './columns.tsx';
import { FileTextOutlined } from '@ant-design/icons';
import api from '@/api/axios';
import { useAuth } from '@/context/AuthContext';

const DashboardTable = () => {
    const { isAdmin, isSuperAdmin } = useAuth();

    const [activeTab, setActiveTab] = useState<'fixed' | 'operational'>('fixed');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchData = async (tab: 'fixed' | 'operational', currentPage: number) => {
        setLoading(true);
        try {
            const endpoint = tab === 'fixed'
                ? '/expenses?expenseType=FIXED&sortBy=createdAt&sortOrder=asc'
                : '/expenses?expenseType=OPERATIONAL&sortBy=createdAt&sortOrder=asc';


            const res = await api.get(`${endpoint}&page=${currentPage}&pageSize=5`);
            const json = res.data;
            if (json.success) {
                setData(json.data || []);
                setTotal(json.pagination?.total || 0);
            }
        } catch (error) {
            console.error('Failed to fetch table data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(activeTab, page);
    }, [activeTab, page]);

    const handleTabChange = (tab: 'fixed' | 'operational') => {
        setActiveTab(tab);
        setPage(1);
    };

    return (
        <Card
            className='w-full h-full flex flex-col'
            styles={{
                header: {
                    padding: 0,
                },
                body: {
                    padding: 0,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                }
            }}
            title={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 pt-4 pb-2 sm:px-6">
                    <div className="flex items-center gap-4 sm:gap-6">
                        <button
                            onClick={() => handleTabChange('fixed')}
                            className={`text-sm sm:text-base font-semibold pb-1 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'fixed'
                                ? 'border-blue-600 text-gray-900'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Fixed Expenses
                        </button>
                        <button
                            onClick={() => handleTabChange('operational')}
                            className={`text-sm sm:text-base font-semibold pb-1 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'operational'
                                ? 'border-blue-600 text-gray-900'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Operational Expenses
                        </button>
                    </div>
                    <a
                        href="#"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            borderRadius: 6,
                            padding: '8px 16px',
                            fontSize: 14,
                            color: '#7db4ebff',
                            backgroundColor: '#ecf3faff',
                            border: '1px solid #7db4ebff',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            alignSelf: 'flex-start',
                        }}
                    >
                        <FileTextOutlined />
                        Generate Report
                    </a>
                </div>
            }
        >
            <div className='flex-1 overflow-x-auto'>
                <Table<any>
                    columns={getColumns(isAdmin, isSuperAdmin, () => fetchData(activeTab, page), () => fetchData(activeTab, page))}
                    dataSource={data}
                    pagination={false}
                    loading={loading}
                    rowKey={(record) => record.id || record.publicId || Math.random().toString()}
                    scroll={{
                        x: 'max-content',
                    }}
                    size="middle"
                    className='w-full'
                    rowClassName="hover:bg-gray-50"
                />
            </div>

            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 border-t border-gray-100'>
                <div className='text-sm text-gray-600'>
                    Showing <span className='font-semibold text-gray-900'>{(page - 1) * 5 + Math.min(1, data.length)}</span> to{' '}
                    <span className='font-semibold text-gray-900'>{(page - 1) * 5 + data.length}</span> of{' '}
                    <span className='font-semibold text-gray-900'>{total}</span> results
                </div>

                <div className='w-full sm:w-auto'>
                    <Pagination
                        current={page}
                        total={total}
                        onChange={(newPage) => setPage(newPage)}
                        className='flex justify-end'
                        align="end"
                        size="small"
                        showSizeChanger={false}
                    />
                </div>
            </div>
        </Card>
    )
}

export default DashboardTable
'use client';
import { useState } from 'react';
import { Card, Table, Pagination } from 'antd';
import type { Invoice } from './columns.tsx';
import { columns, data } from './columns.tsx';
import { FileTextOutlined } from '@ant-design/icons';

const DashboardTable = () => {
    const [activeTab, setActiveTab] = useState<'pending' | 'recent'>('pending');

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
                            onClick={() => setActiveTab('pending')}
                            className={`text-sm sm:text-base font-semibold pb-1 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'pending'
                                ? 'border-blue-600 text-gray-900'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Pending Invoices
                        </button>
                        <button
                            onClick={() => setActiveTab('recent')}
                            className={`text-sm sm:text-base font-semibold pb-1 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'recent'
                                ? 'border-blue-600 text-gray-900'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Recent Transactions
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
                <Table<Invoice>
                    columns={columns}
                    dataSource={data}
                    pagination={false}
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
                    Showing <span className='font-semibold text-gray-900'>5</span> of{' '}
                    <span className='font-semibold text-gray-900'>25</span> results
                </div>

                <div className='w-full sm:w-auto'>
                    <Pagination
                        defaultCurrent={1}
                        total={10}
                        className='flex justify-end'
                        align="end"
                        size="small"
                    />
                </div>
            </div>
        </Card>
    )
}

export default DashboardTable
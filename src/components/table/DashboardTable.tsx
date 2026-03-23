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
            title={
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`text-base font-semibold pb-1 border-b-2 transition-colors ${activeTab === 'pending'
                            ? 'border-blue-600 text-gray-900'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Pending Invoices
                    </button>
                    <button
                        onClick={() => setActiveTab('recent')}
                        className={`text-base font-semibold pb-1 border-b-2 transition-colors ${activeTab === 'recent'
                            ? 'border-blue-600 text-gray-900'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Recent Transactions
                    </button>
                </div>
            }
            extra={
                <a
                    href="#"
                    style={{
                        display: 'inline-flex',
                        width: 153,
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        borderRadius: 6,
                        padding: '8px 0',
                        fontSize: 14,
                        color: '#7db4ebff',
                        backgroundColor: '#ecf3faff',
                        border: '1px solid #7db4ebff',
                        textDecoration: 'none',
                    }}
                >
                    <FileTextOutlined />
                    Generate Report
                </a>
            }
            className='w-full h-full flex flex-col'
            styles={{
                body: {
                    padding: 0,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                }
            }}
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

            {/* Footer Section */}
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border-t border-gray-100'>
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
                    />
                </div>
            </div>
        </Card>
    )
}

export default DashboardTable
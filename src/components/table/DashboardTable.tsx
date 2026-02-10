'use client';
import { Card, Table, Button, Pagination } from 'antd';
import type { Order } from './columns.tsx';
import { columns, data } from './columns.tsx';
import { FileTextOutlined } from '@ant-design/icons';

const DashboardTable = () => {
    return (
        <Card
            title="Recent Orders"
            extra={
                <Button
                    className='text-[#2BD0EA] bg-[#E8FAFD] border-none hover:text-blue-700 hover:bg-[#D0F5FA] flex items-center gap-2'
                    icon={<FileTextOutlined />}
                >
                    Generate Report
                </Button>
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
                <Table<Order>
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

            {/* Footer Section - Improved */}
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
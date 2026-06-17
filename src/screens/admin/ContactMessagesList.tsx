import { useEffect, useState } from "react";
import { Table, Button, Modal, Input, Tag, Popconfirm, message, Space, Card } from "antd";
import { DeleteOutlined, EyeOutlined, SearchOutlined } from "@ant-design/icons";
import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";

export default function ContactMessagesList() {
    const { isAdmin, isSuperAdmin } = useAuth();
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    
    const [selectedContact, setSelectedContact] = useState<any>(null);
    const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);

    const canDelete = isSuperAdmin || isAdmin;

    const fetchContacts = async (page = currentPage, limit = pageSize, searchQuery = search, showSpinner = true) => {
        try {
            if (showSpinner) setLoading(true);
            const queryParams = [];
            queryParams.push(`page=${page}`);
            queryParams.push(`pageSize=${limit}`);
            if (searchQuery) {
                queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
            }
            
            const res = await api.get(`/contacts?${queryParams.join("&")}`);
            
            const responseData = res.data;
            if (responseData) {
                setContacts(responseData.data || responseData.records || []);
                setTotal(responseData.total || responseData.count || 0);
            }
        } catch (error) {
            message.error("Failed to fetch contact messages");
        } finally {
            if (showSpinner) setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch with spinner
        fetchContacts(currentPage, pageSize, search, true);

        // Auto-refresh contacts every 15 seconds in the background
        const intervalId = setInterval(() => {
            fetchContacts(currentPage, pageSize, search, false);
        }, 15000);

        return () => clearInterval(intervalId);
    }, [currentPage, pageSize, search]);

    const handleSearch = () => {
        setCurrentPage(1);
        fetchContacts(1, pageSize, search);
    };

    const handleReset = () => {
        setSearch("");
        setCurrentPage(1);
        fetchContacts(1, pageSize, "");
    };

    const handleDelete = async (publicId: string) => {
        try {
            await api.delete(`/contacts/${publicId}`);
            message.success("Contact message deleted successfully");
            fetchContacts(currentPage, pageSize, search);
        } catch (error: any) {
            message.error(error.response?.data?.message || "Failed to delete contact message");
        }
    };

    const showDetails = (contact: any) => {
        setSelectedContact(contact);
        setIsDetailsModalVisible(true);
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => (
                <div className="font-medium text-gray-800">{text}</div>
            )
        },
        {
            title: 'Contact Details',
            key: 'contactDetails',
            render: (_: any, record: any) => (
                <div className="flex flex-col">
                    <span className="text-sm text-gray-700">{record.email}</span>
                    {record.phone && <span className="text-xs text-gray-500">{record.phone}</span>}
                </div>
            )
        },
        {
            title: 'Website',
            dataIndex: 'website',
            key: 'website',
            render: (text: string) => text ? (
                <a href={text.startsWith('http') ? text : `http://${text}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm truncate max-w-[150px] inline-block">
                    {text}
                </a>
            ) : '-'
        },
        {
            title: 'Submitted At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text: string) => new Date(text).toLocaleString(),
        },
        {
            title: 'Consent',
            dataIndex: 'consent',
            key: 'consent',
            render: (consent: boolean) => (
                <Tag color={consent ? 'green' : 'gray'}>
                    {consent ? 'Granted' : 'Not Granted'}
                </Tag>
            )
        },
        {
            title: 'Source',
            dataIndex: 'source',
            key: 'source',
            render: (text: string) => text ? <Tag color="blue">{text}</Tag> : '-'
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Button 
                        type="text" 
                        icon={<EyeOutlined />} 
                        onClick={() => showDetails(record)}
                        className="text-blue-600 hover:text-blue-800"
                    />
                    {canDelete && (
                        <Popconfirm
                            title="Delete contact message"
                            description="Are you sure to delete this contact message?"
                            onConfirm={() => handleDelete(record.publicId || record.id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button danger type="text" icon={<DeleteOutlined />} />
                        </Popconfirm>
                    )}
                </Space>
            )
        },
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen w-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-[#405189]">Contact Messages</h1>
            </div>

            <Card className="mb-6 border-none shadow-sm">
                <div className="flex gap-3 max-w-md">
                    <Input
                        placeholder="Search name, email or message..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onPressEnter={handleSearch}
                        prefix={<SearchOutlined className="text-gray-400" />}
                    />
                    <Button type="primary" onClick={handleSearch}>
                        Search
                    </Button>
                    <Button onClick={handleReset}>
                        Reset
                    </Button>
                </div>
            </Card>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <Table
                    dataSource={contacts}
                    columns={columns}
                    rowKey={(record) => record.publicId || record.id}
                    loading={loading}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: total,
                        onChange: (page, size) => {
                            setCurrentPage(page);
                            setPageSize(size);
                        },
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50']
                    }}
                    onRow={(record) => ({
                        onDoubleClick: () => showDetails(record),
                        className: "cursor-pointer"
                    })}
                />
            </div>

            <Modal
                title={<span className="text-lg font-semibold text-gray-800">Contact Message Details</span>}
                open={isDetailsModalVisible}
                onCancel={() => setIsDetailsModalVisible(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setIsDetailsModalVisible(false)}>
                        Close
                    </Button>
                ]}
                width={600}
                destroyOnClose
            >
                {selectedContact && (
                    <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                            <div>
                                <span className="text-xs text-gray-500 block font-medium">Name</span>
                                <span className="font-semibold text-gray-800">{selectedContact.name}</span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 block font-medium">Submitted At</span>
                                <span className="font-semibold text-gray-800">
                                    {new Date(selectedContact.createdAt).toLocaleString()}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 block font-medium">Email Address</span>
                                <a href={`mailto:${selectedContact.email}`} className="text-blue-600 hover:underline font-semibold">
                                    {selectedContact.email}
                                </a>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 block font-medium">Phone Number</span>
                                {selectedContact.phone ? (
                                    <a href={`tel:${selectedContact.phone}`} className="text-blue-600 hover:underline font-semibold">
                                        {selectedContact.phone}
                                    </a>
                                ) : (
                                    <span className="text-gray-400 font-medium">-</span>
                                )}
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 block font-medium">Website</span>
                                {selectedContact.website ? (
                                    <a 
                                        href={selectedContact.website.startsWith('http') ? selectedContact.website : `http://${selectedContact.website}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-600 hover:underline font-semibold truncate max-w-[200px] inline-block"
                                    >
                                        {selectedContact.website}
                                    </a>
                                ) : (
                                    <span className="text-gray-400 font-medium">-</span>
                                )}
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 block font-medium">Marketing Consent</span>
                                <Tag color={selectedContact.consent ? 'green' : 'gray'} className="mt-1">
                                    {selectedContact.consent ? 'Granted' : 'Not Granted'}
                                </Tag>
                            </div>
                            {selectedContact.source && (
                                <div className="col-span-2">
                                    <span className="text-xs text-gray-500 block font-medium">Source</span>
                                    <Tag color="blue" className="mt-1">{selectedContact.source}</Tag>
                                </div>
                            )}
                        </div>

                        <div className="border border-gray-100 p-4 rounded-lg bg-white">
                            <span className="text-xs text-gray-500 block mb-2 font-semibold">Message</span>
                            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed max-h-60 overflow-y-auto pr-2 bg-gray-50/50 p-3 rounded border border-gray-100">
                                {selectedContact.message}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

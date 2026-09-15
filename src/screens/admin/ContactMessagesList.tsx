import { useState } from "react"
import { Table, Button, Modal, Input, Tag, Popconfirm, message, Space } from "antd"
import { DeleteOutlined, EyeOutlined, SearchOutlined, DownloadOutlined } from "@ant-design/icons"
import { useQuery, useMutation } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { apiClient } from "@/lib/apiClient"
import { queryClient } from "@/lib/queryClient"
import { useAuth } from "@/context/AuthContext"
import type { ContactMessage } from "@/types"

type ContactsResponse = {
    data?: ContactMessage[]
    records?: ContactMessage[]
    total?: number
    count?: number
}

export default function ContactMessagesList() {
    const { isAdmin, isSuperAdmin } = useAuth()
    const [search, setSearch] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const [selectedContact, setSelectedContact] = useState<ContactMessage | null>(null)
    const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false)

    const canDelete = isSuperAdmin || isAdmin

    const { data: contactsData, isLoading } = useQuery<ContactsResponse>({
        queryKey: ['contacts', currentPage, pageSize, search],
        queryFn: async () => {
            const queryParams = []
            queryParams.push(`page=${currentPage}`)
            queryParams.push(`pageSize=${pageSize}`)
            if (search) {
                queryParams.push(`search=${encodeURIComponent(search)}`)
            }

            const res = await apiClient.get(`/contacts?${queryParams.join("&")}`)
            return res.data
        }
    })

    const contacts = contactsData?.data || contactsData?.records || []
    const total = contactsData?.total || contactsData?.count || 0

    const deleteMutation = useMutation({
        mutationFn: async (publicId: string) => {
            await apiClient.delete(`/contacts/${publicId}`)
        },
        onSuccess: () => {
            message.success("Contact message deleted successfully")
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            message.error(error.response?.data?.message || "Failed to delete contact message")
        }
    })

    const exportMutation = useMutation({
        mutationFn: async () => {
            const queryParams = []
            if (search) {
                queryParams.push(`search=${encodeURIComponent(search)}`)
            }
            const res = await apiClient.get(`/contacts/export?${queryParams.join("&")}`, {
                responseType: 'blob'
            })
            return res.data
        },
        onSuccess: (data) => {
            const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', 'contact_messages.xlsx')
            document.body.appendChild(link)
            link.click()

            link.parentNode?.removeChild(link)
            window.URL.revokeObjectURL(url)
            message.success("Contact messages exported successfully")
        },
        onError: () => {
            message.error("Failed to export contact messages")
        }
    })

    const handleSearch = () => {
        setCurrentPage(1)
    }

    const handleReset = () => {
        setSearch("")
        setCurrentPage(1)
    }

    const showDetails = (contact: ContactMessage) => {
        setSelectedContact(contact)
        setIsDetailsModalVisible(true)
    }

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
            render: (_: unknown, record: ContactMessage) => (
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
                <a href={text.startsWith('http') ? text : `http://${text}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm truncate max-w-[150px] inline-block font-medium">
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
            title: 'Source',
            dataIndex: 'source',
            key: 'source',
            render: (text: string) => text ? <Tag color="blue">{text}</Tag> : '-'
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: unknown, record: ContactMessage) => (
                <Space size="middle">
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => showDetails(record)}
                        className="text-primary"
                    />
                    {canDelete && (
                        <Popconfirm
                            title="Delete contact message"
                            description="Are you sure to delete this contact message?"
                            onConfirm={() => deleteMutation.mutate(record.publicId || record.id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button danger type="text" icon={<DeleteOutlined />} />
                        </Popconfirm>
                    )}
                </Space>
            )
        },
    ]

    return (
        <div className="p-6 bg-gray-50 min-h-screen w-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-primary">Contact Messages</h1>
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    loading={exportMutation.isPending}
                    onClick={() => exportMutation.mutate()}
                >
                    Export Excel
                </Button>
            </div>

            <div className="mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
                    <Input
                        placeholder="Search name, email or message..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onPressEnter={handleSearch}
                        prefix={<SearchOutlined className="text-gray-400" />}
                        className="flex-1"
                    />
                    <div className="flex gap-2">
                        <Button
                            type="primary"
                            onClick={handleSearch}
                        >
                            Search
                        </Button>
                        <Button onClick={handleReset}>
                            Reset
                        </Button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <Table
                    dataSource={contacts}
                    columns={columns}
                    rowKey={(record) => record.publicId || record.id}
                    loading={isLoading}
                    scroll={{ x: "max-content" }}
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
                title={<span className="text-lg font-semibold text-primary">Contact Message Details</span>}
                open={isDetailsModalVisible}
                onCancel={() => setIsDetailsModalVisible(false)}
                footer={[
                    <Button
                        key="close"
                        type="primary"
                        onClick={() => setIsDetailsModalVisible(false)}
                    >
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
                                <a href={`mailto:${selectedContact.email}`} className="text-primary hover:underline font-semibold">
                                    {selectedContact.email}
                                </a>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 block font-medium">Phone Number</span>
                                {selectedContact.phone ? (
                                    <a href={`tel:${selectedContact.phone}`} className="text-primary hover:underline font-semibold">
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
                                        className="text-primary hover:underline font-semibold truncate max-w-[200px] inline-block"
                                    >
                                        {selectedContact.website}
                                    </a>
                                ) : (
                                    <span className="text-gray-400 font-medium">-</span>
                                )}
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

import { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Popconfirm, message } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";

const { TextArea } = Input;

export default function ClientsList() {
    const { isAdmin, isSuperAdmin } = useAuth();
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingClient, setEditingClient] = useState<any>(null);
    const [form] = Form.useForm();

    const canEdit = isAdmin || isSuperAdmin;
    const canDelete = isSuperAdmin;

    const fetchClients = async () => {
        try {
            setLoading(true);
            const res = await api.get('/clients?page=1&pageSize=100');
            setClients(res.data.data || res.data);
        } catch (error) {
            message.error("Failed to fetch clients");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleDelete = async (publicId: string) => {
        try {
            await api.delete(`/clients/${publicId}`);
            message.success("Client deleted successfully");
            fetchClients();
        } catch (error: any) {
            message.error(error.response?.data?.message || "Failed to delete client");
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            setSubmitting(true);
            if (editingClient) {
                await api.put(`/clients/${editingClient.publicId}`, values);
                message.success("Client updated successfully!");
            } else {
                await api.post('/clients', values);
                message.success("Client created successfully!");
            }
            setIsModalVisible(false);
            form.resetFields();
            setEditingClient(null);
            fetchClients();
        } catch (error: any) {
            message.error(error.response?.data?.message || "Failed to save client");
        } finally {
            setSubmitting(false);
        }
    };

    const openEditModal = (client: any) => {
        setEditingClient(client);
        form.setFieldsValue(client);
        setIsModalVisible(true);
    };

    const columns = [
        {
            title: 'Client Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-800">{text}</span>
                    <span className="text-xs text-gray-500">{record.companyName}</span>
                </div>
            )
        },
        {
            title: 'Contact',
            key: 'contact',
            render: (_: any, record: any) => (
                <div className="flex flex-col">
                    <span className="text-sm">{record.email}</span>
                    <span className="text-xs text-gray-500">{record.phone}</span>
                </div>
            )
        },
        {
            title: 'Location',
            key: 'location',
            render: (_: any, record: any) => (
                <span className="text-sm text-gray-600">
                    {[record.city, record.state, record.country].filter(Boolean).join(', ') || '-'}
                </span>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: any) => (
                <div className="flex gap-2">
                    {canEdit && (
                        <Button 
                            type="text" 
                            icon={<EditOutlined />} 
                            onClick={() => openEditModal(record)}
                        />
                    )}
                    {canDelete && (
                        <Popconfirm
                            title="Delete the client"
                            description="Are you sure to delete this client?"
                            onConfirm={() => handleDelete(record.publicId)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button danger type="text" icon={<DeleteOutlined />} />
                        </Popconfirm>
                    )}
                </div>
            )
        },
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen w-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-[#405189]">Clients</h1>
                {canEdit && (
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={() => {
                            setEditingClient(null);
                            form.resetFields();
                            setIsModalVisible(true);
                        }}
                    >
                        Add Client
                    </Button>
                )}
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <Table 
                    dataSource={clients} 
                    columns={columns} 
                    rowKey="publicId" 
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </div>

            <Modal
                title={editingClient ? "Edit Client" : "Add New Client"}
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                    setEditingClient(null);
                }}
                footer={null}
                destroyOnClose
            >
                <Form layout="vertical" form={form} onFinish={handleSubmit} className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="name" label="Primary Contact Name" rules={[{ required: true }]}>
                            <Input placeholder="John Doe" />
                        </Form.Item>
                        <Form.Item name="companyName" label="Company Name">
                            <Input placeholder="Acme Corp" />
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="email" label="Email Address" rules={[{ type: 'email' }, { required: true }]}>
                            <Input placeholder="contact@acme.com" />
                        </Form.Item>
                        <Form.Item name="phone" label="Phone Number">
                            <Input placeholder="+919876543210" />
                        </Form.Item>
                    </div>

                    <Form.Item name="billingAddressLine1" label="Billing Address">
                        <Input placeholder="123 Main St" />
                    </Form.Item>

                    <div className="grid grid-cols-3 gap-4">
                        <Form.Item name="city" label="City">
                            <Input placeholder="Mumbai" />
                        </Form.Item>
                        <Form.Item name="state" label="State">
                            <Input placeholder="Maharashtra" />
                        </Form.Item>
                        <Form.Item name="country" label="Country">
                            <Input placeholder="India" />
                        </Form.Item>
                    </div>

                    <Form.Item name="notes" label="Notes">
                        <TextArea rows={2} placeholder="Premium client..." />
                    </Form.Item>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            {editingClient ? "Save Changes" : "Create Client"}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}

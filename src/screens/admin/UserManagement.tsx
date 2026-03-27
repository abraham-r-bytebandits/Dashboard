import { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Select, Tag, Popconfirm, message } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";

const { Option } = Select;

export default function UserManagement() {
    const { isSuperAdmin } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    const fetchUsers = async () => {
        try {
            setLoading(true);
            // Default pagination and fetching all users for now
            const res = await api.get('/admin/users?page=1&pageSize=100');
            // Assuming the API returns a standard paginated response { success, data: [...] }
            setUsers(res.data.data || res.data);
        } catch (error) {
            message.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isSuperAdmin) {
            fetchUsers();
        }
    }, [isSuperAdmin]);

    const handleRoleChange = async (publicId: string, newRole: string) => {
        try {
            await api.patch(`/admin/users/${publicId}/role`, { role: newRole });
            message.success("Role updated successfully");
            fetchUsers();
        } catch (error: any) {
            message.error(error.response?.data?.message || "Failed to update role");
        }
    };

    const handleDelete = async (publicId: string) => {
        try {
            await api.delete(`/admin/users/${publicId}`);
            message.success("User deleted successfully");
            fetchUsers();
        } catch (error: any) {
            message.error(error.response?.data?.message || "Failed to delete user");
        }
    };

    const handleCreateUser = async (values: any) => {
        try {
            setSubmitting(true);
            const res = await api.post('/admin/users', values);
            message.success("User created successfully!");
            if (res.data?.temporaryPassword) {
                // If the backend returned a temporary password, show it to admin
                Modal.info({
                    title: 'User Created',
                    content: `The user's temporary password is: \n\n ${res.data.temporaryPassword} \n\n Please share it securely.`,
                });
            }
            setIsModalVisible(false);
            form.resetFields();
            fetchUsers();
        } catch (error: any) {
            message.error(error.response?.data?.message || "Failed to create user");
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        {
            title: 'Name',
            key: 'name',
            render: (_: any, record: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-800">
                        {record.profile?.firstName} {record.profile?.lastName}
                    </span>
                    <span className="text-xs text-gray-500">{record.email || record.username}</span>
                </div>
            )
        },
        {
            title: 'Phone',
            dataIndex: ['profile', 'phone'],
            key: 'phone',
            render: (text: string) => text || '-',
        },
        {
            title: 'Role',
            key: 'role',
            render: (_: any, record: any) => {
                const currentRole = record.role || (record.roles && record.roles[0]) || 'USER';
                // SUPER_ADMIN cannot be changed by another SUPER_ADMIN via this dropdown usually, 
                // but we map the roles defensively
                if (currentRole === 'SUPER_ADMIN') {
                    return <Tag color="purple">SUPER ADMIN</Tag>;
                }

                return (
                    <Select
                        value={currentRole}
                        style={{ width: 100 }}
                        onChange={(val) => handleRoleChange(record.publicId, val)}
                    >
                        <Option value="ADMIN">ADMIN</Option>
                        <Option value="USER">USER</Option>
                    </Select>
                );
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'ACTIVE' ? 'green' : 'volcano'}>
                    {status || 'UNKNOWN'}
                </Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: any) => {
                const currentRole = record.role || (record.roles && record.roles[0]) || 'USER';
                if (currentRole === 'SUPER_ADMIN') return null; // Can't delete SUPER_ADMIN
                return (
                    <Popconfirm
                        title="Delete the user"
                        description="Are you sure to delete this user?"
                        onConfirm={() => handleDelete(record.publicId)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button danger type="text" icon={<DeleteOutlined />} />
                    </Popconfirm>
                );
            }
        },
    ];

    if (!isSuperAdmin) {
        return null; // ProtectedRoute will handle redirect anyway
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen w-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-[#405189]">User Management</h1>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalVisible(true)}
                >
                    Add User
                </Button>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <Table
                    dataSource={users}
                    columns={columns}
                    rowKey="publicId"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </div>

            <Modal
                title="Create New User"
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
                destroyOnClose
            >
                <Form layout="vertical" form={form} onFinish={handleCreateUser} className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                            <Input placeholder="John" />
                        </Form.Item>
                        <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                            <Input placeholder="Doe" />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="email"
                        label="Email Address"
                        rules={[{ type: 'email' }, { required: true, message: 'Email is required' }]}
                    >
                        <Input placeholder="john@example.com" />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="phone" label="Phone Number">
                            <Input placeholder="+919876543210" />
                        </Form.Item>

                        <Form.Item name="role" label="Role" rules={[{ required: true }]} initialValue="USER">
                            <Select>
                                <Option value="ADMIN">Admin</Option>
                                <Option value="USER">User</Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[{ required: true, message: 'Password is required' }]}
                    >
                        <Input.Password placeholder="Test@1234" />
                    </Form.Item>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            Create Account
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}

import { useEffect, useState } from "react";
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Popconfirm,
    message,
    Tag,
    Tooltip,
    Space,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    GlobalOutlined,
    LockOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/context/AuthContext";
import api from "@/api/axios";

interface SiteEntry {
    id: string;
    name: string;
    userName: string;
    url?: string;
    password: string;
}

// ── PasswordCell ───────────────────────────────────────────────────────────
function PasswordCell({ password }: { password: string }) {
    const [visible, setVisible] = useState(false);
    return (
        <Space>
            <span
                style={{
                    fontFamily: "monospace",
                    letterSpacing: visible ? "normal" : "0.15em",
                    fontSize: 13,
                    color: "#374151",
                }}
            >
                {visible ? password : "•".repeat(Math.min(password.length, 10))}
            </span>
            <Tooltip title={visible ? "Hide password" : "Show password"}>
                <Button
                    type="text"
                    size="small"
                    icon={visible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    onClick={() => setVisible((v) => !v)}
                    style={{ color: "#6B7280" }}
                />
            </Tooltip>
        </Space>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function SiteManagement() {
    const { isSuperAdmin } = useAuth();

    const [sites, setSites] = useState<SiteEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<SiteEntry | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    // ── fetch / load ────────────────────────────────────────────────────────
    const fetchSites = async () => {
        setLoading(true);
        try {
            const res = await api.get('/sites');
            // Safely handle paginated response { success, data } vs direct array
            const fetchedData = res.data?.data || res.data;
            setSites(Array.isArray(fetchedData) ? fetchedData : []);
        } catch (error: any) {
            console.error("Fetch sites error:", error);
            message.error(error.response?.data?.message || "Failed to load sites.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isSuperAdmin) fetchSites();
    }, [isSuperAdmin]);

    // ── open modal ─────────────────────────────────────────────────────────
    const openAdd = () => {
        setEditingRecord(null);
        form.resetFields();
        setModalOpen(true);
    };

    const openEdit = (record: SiteEntry) => {
        setEditingRecord(record);
        form.setFieldsValue({ name: record.name, url: record.url, userName: record.userName, password: record.password });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingRecord(null);
        form.resetFields();
    };

    // ── submit ─────────────────────────────────────────────────────────────
    const handleSubmit = async (values: { name: string; url?: string; userName: string; password: string }) => {
        setSubmitting(true);
        try {
            if (editingRecord) {
                // Update
                await api.put(`/sites/${editingRecord.id}`, values);
                message.success("Site updated successfully.");
            } else {
                // Create
                await api.post('/sites', values);
                message.success("Site added successfully.");
            }

            await fetchSites();
            closeModal();
        } catch (error: any) {
            console.error("Submit site error:", error);
            message.error(error.response?.data?.message || "Operation failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // ── delete ─────────────────────────────────────────────────────────────
    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/sites/${id}`);
            message.success("Site deleted.");
            await fetchSites();
        } catch (error: any) {
            console.error("Delete site error:", error);
            message.error(error.response?.data?.message || "Failed to delete site.");
        }
    };

    // ── columns ────────────────────────────────────────────────────────────
    const columns = [
        {
            title: "No.",
            key: "no",
            width: 70,
            render: (_: any, __: any, index: number) => (
                <span className="text-gray-500 font-medium">{index + 1}</span>
            ),
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            render: (name: string) => (
                <span className="font-semibold text-gray-800">{name}</span>
            ),
        },
        {
            title: "URL",
            dataIndex: "url",
            key: "url",
            render: (url?: string) =>
                url ? (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[#405189] hover:underline break-all"
                    >
                        <GlobalOutlined style={{ fontSize: 12 }} />
                        {url}
                    </a>
                ) : (
                    <span className="text-gray-400 italic">No URL</span>
                ),
        },
        {
            title: "User Name",
            dataIndex: "userName",
            key: "userName",
            render: (userName: string) => (
                <span className="font-semibold text-gray-800">{userName}</span>
            ),
        },
        {
            title: "Password",
            dataIndex: "password",
            key: "password",
            render: (pwd: string) => <PasswordCell password={pwd} />,
        },
        {
            title: "Actions",
            key: "actions",
            width: 120,
            align: "center" as const,
            render: (_: any, record: SiteEntry) => (
                <Space size="small">
                    {/* Edit */}
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => openEdit(record)}
                            style={{ color: "#405189" }}
                        />
                    </Tooltip>

                    {/* Delete */}
                    <Popconfirm
                        title="Delete this site?"
                        description="This action cannot be undone."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                        cancelText="Cancel"
                    >
                        <Tooltip title="Delete">
                            <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // ── access guard ────────────────────────────────────────────────────────
    if (!isSuperAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full gap-4">
                <LockOutlined style={{ fontSize: 48, color: "#E5395A" }} />
                <p className="text-lg font-semibold text-gray-600">
                    Access Denied — Super Admin only
                </p>
            </div>
        );
    }

    // ── render ──────────────────────────────────────────────────────────────
    return (
        <div className="p-6 bg-gray-50 min-h-screen w-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-[#405189] mb-1">
                        Site Management
                    </h1>
                    <p className="text-sm text-gray-500">
                        Manage site credentials — visible to Super Admins only.
                    </p>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openAdd}
                    style={{ background: "#405189", borderColor: "#405189" }}
                >
                    Add Site
                </Button>
            </div>

            {/* Status badge */}
            <div className="mb-4">
                <Tag color="purple" icon={<LockOutlined />}>
                    Super Admin Access
                </Tag>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <Table
                    dataSource={sites}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    scroll={{ x: "max-content" }}
                    locale={{ emptyText: "No sites added yet." }}
                />
            </div>

            {/* Add / Edit Modal */}
            <Modal
                title={
                    <span className="text-[#405189] font-semibold">
                        {editingRecord ? "Edit Site" : "Add New Site"}
                    </span>
                }
                open={modalOpen}
                onCancel={closeModal}
                footer={null}
                destroyOnHidden
                width={480}
            >
                <Form
                    layout="vertical"
                    form={form}
                    onFinish={handleSubmit}
                    className="mt-4"
                >
                    {/* Name */}
                    <Form.Item
                        name="name"
                        label="Site Name"
                        rules={[{ required: true, message: "Site name is required" }]}
                    >
                        <Input placeholder="e.g. Main Portal" />
                    </Form.Item>

                    {/* URL */}
                    <Form.Item
                        name="url"
                        label="URL"
                        required={false}
                        rules={[
                            { type: "url", message: "Please enter a valid URL" },
                        ]}
                    >
                        <Input placeholder="https://example.com" prefix={<GlobalOutlined />} />
                    </Form.Item>

                    {/* User Name */}
                    <Form.Item
                        name="userName"
                        label="User Name"
                        rules={[{ required: true, message: "User name is required" }]}
                    >
                        <Input placeholder="e.g. admin" />
                    </Form.Item>

                    {/* Password */}
                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[{ required: true, message: "Password is required" }]}
                    >
                        <Input.Password placeholder="Enter password" prefix={<LockOutlined />} />
                    </Form.Item>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 mt-2">
                        <Button onClick={closeModal}>Cancel</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitting}
                            style={{ background: "#405189", borderColor: "#405189" }}
                        >
                            {editingRecord ? "Save Changes" : "Add Site"}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}

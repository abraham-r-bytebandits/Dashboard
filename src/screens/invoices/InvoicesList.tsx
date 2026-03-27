import { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Select, DatePicker, Popconfirm, message, Tag, InputNumber, Row, Col, Card } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined, DollarOutlined, MinusCircleOutlined } from "@ant-design/icons";
import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

export default function InvoicesList() {
    const { isAdmin, isSuperAdmin } = useAuth();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Modals state
    const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
    const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<any>(null);
    const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null);

    const [invoiceForm] = Form.useForm();
    const [paymentForm] = Form.useForm();

    const canEdit = isAdmin || isSuperAdmin;
    const canDelete = isSuperAdmin;

    const fetchData = async () => {
        try {
            setLoading(true);
            const [invRes, cliRes] = await Promise.all([
                api.get('/invoices?page=1&pageSize=100'),
                api.get('/clients?page=1&pageSize=100')
            ]);
            setInvoices(invRes.data.data || invRes.data);
            setClients(cliRes.data.data || cliRes.data);
        } catch (error) {
            message.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (publicId: string) => {
        try {
            await api.delete(`/invoices/${publicId}`);
            message.success("Invoice deleted successfully");
            fetchData();
        } catch (error: any) {
            message.error(error.response?.data?.message || "Failed to delete invoice");
        }
    };

    const handleInvoiceSubmit = async (values: any) => {
        try {
            setSubmitting(true);
            const payload = {
                ...values,
                issuedDate: values.issuedDate ? values.issuedDate.toISOString() : undefined,
                dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
            };

            if (editingInvoice) {
                await api.put(`/invoices/${editingInvoice.publicId}`, payload);
                message.success("Invoice updated successfully!");
            } else {
                await api.post('/invoices', payload);
                message.success("Invoice created successfully!");
            }
            setIsInvoiceModalVisible(false);
            invoiceForm.resetFields();
            setEditingInvoice(null);
            fetchData();
        } catch (error: any) {
            message.error(error.response?.data?.message || "Failed to save invoice");
        } finally {
            setSubmitting(false);
        }
    };

    const handlePaymentSubmit = async (values: any) => {
        try {
            setSubmitting(true);
            const payload = {
                ...values,
                paidAt: values.paidAt ? values.paidAt.toISOString() : new Date().toISOString(),
            };
            await api.post(`/invoices/${paymentInvoiceId}/payments`, payload);
            message.success("Payment recorded successfully!");
            setIsPaymentModalVisible(false);
            paymentForm.resetFields();
            setPaymentInvoiceId(null);
            fetchData();
        } catch (error: any) {
            message.error(error.response?.data?.message || "Failed to record payment");
        } finally {
            setSubmitting(false);
        }
    };

    const openEditModal = (invoice: any) => {
        setEditingInvoice(invoice);
        invoiceForm.setFieldsValue({
            ...invoice,
            issuedDate: invoice.issuedDate ? dayjs(invoice.issuedDate) : null,
            dueDate: invoice.dueDate ? dayjs(invoice.dueDate) : null,
        });
        setIsInvoiceModalVisible(true);
    };

    const openPaymentModal = (publicId: string) => {
        setPaymentInvoiceId(publicId);
        setIsPaymentModalVisible(true);
    };

    const columns = [
        {
            title: 'Invoice',
            key: 'title',
            render: (_: any, record: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-800">{record.title}</span>
                    <span className="text-xs text-gray-400">
                        Client: {clients.find(c => c.publicId === record.clientPublicId)?.name || 'Unknown'}
                    </span>
                </div>
            )
        },
        {
            title: 'Dates',
            key: 'dates',
            render: (_: any, record: any) => (
                <div className="flex flex-col text-sm">
                    <span>Issued: {dayjs(record.issuedDate).format('MMM D, YYYY')}</span>
                    <span className="text-red-500">Due: {dayjs(record.dueDate).format('MMM D, YYYY')}</span>
                </div>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = 'default';
                if (status === 'PAID') color = 'success';
                else if (status === 'PARTIAL') color = 'processing';
                else if (status === 'PENDING') color = 'warning';
                else if (status === 'OVERDUE') color = 'error';
                return <Tag color={color}>{status || 'DRAFT'}</Tag>;
            }
        },
        {
            title: 'Total Amount',
            key: 'total',
            render: (_: any, record: any) => {
                const total = record.items?.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0) || 0;
                return <span className="font-semibold text-gray-700">{record.currency || 'INR'} {total.toLocaleString()}</span>;
            }
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: any) => (
                <div className="flex gap-2">
                    {canEdit && record.status !== 'PAID' && (
                        <Button
                            type="text"
                            size="small"
                            icon={<DollarOutlined />}
                            onClick={() => openPaymentModal(record.publicId)}
                            title="Record Payment"
                        />
                    )}
                    {canEdit && (
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => openEditModal(record)}
                        />
                    )}
                    {canDelete && (
                        <Popconfirm
                            title="Delete invoice"
                            onConfirm={() => handleDelete(record.publicId)}
                            okText="Yes" cancelText="No"
                        >
                            <Button danger type="text" size="small" icon={<DeleteOutlined />} />
                        </Popconfirm>
                    )}
                </div>
            )
        },
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen w-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-[#405189]">Invoices</h1>
                {canEdit && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setEditingInvoice(null);
                            invoiceForm.resetFields();
                            setIsInvoiceModalVisible(true);
                        }}
                    >
                        Create Invoice
                    </Button>
                )}
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <Table
                    dataSource={invoices}
                    columns={columns}
                    rowKey="publicId"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </div>

            {/* Invoice Creation/Edit Modal */}
            <Modal
                title={editingInvoice ? "Edit Invoice" : "Create New Invoice"}
                open={isInvoiceModalVisible}
                onCancel={() => setIsInvoiceModalVisible(false)}
                footer={null}
                width={800}
                destroyOnClose
            >
                <Form layout="vertical" form={invoiceForm} onFinish={handleInvoiceSubmit} className="mt-4">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="title" label="Invoice Title" rules={[{ required: true }]}>
                                <Input placeholder="Website Development" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="clientPublicId" label="Client" rules={[{ required: true }]}>
                                <Select placeholder="Select Client" showSearch optionFilterProp="children">
                                    {clients.map(c => (
                                        <Option key={c.publicId} value={c.publicId}>{c.name} ({c.companyName})</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="currency" label="Currency" initialValue="INR">
                                <Select>
                                    <Option value="INR">INR</Option>
                                    <Option value="USD">USD</Option>
                                    <Option value="EUR">EUR</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="issuedDate" label="Issue Date" rules={[{ required: true }]}>
                                <DatePicker className="w-full" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="dueDate" label="Due Date" rules={[{ required: true }]}>
                                <DatePicker className="w-full" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="description" label="Description">
                        <TextArea rows={2} placeholder="Project details..." />
                    </Form.Item>

                    {/* Dynamic Line Items */}
                    <Card size="small" title="Line Items" className="mb-4">
                        <Form.List name="items" initialValue={[{}]}>
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Row gutter={8} key={key} className="items-end mb-2">
                                            <Col span={8}>
                                                <Form.Item {...restField} name={[name, 'itemName']} label={key === 0 ? "Item Name" : ""} rules={[{ required: true }]}>
                                                    <Input placeholder="Service" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={4}>
                                                <Form.Item {...restField} name={[name, 'quantity']} label={key === 0 ? "Qty" : ""} rules={[{ required: true }]} initialValue={1}>
                                                    <InputNumber className="w-full" min={1} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={5}>
                                                <Form.Item {...restField} name={[name, 'unitPrice']} label={key === 0 ? "Unit Price" : ""} rules={[{ required: true }]}>
                                                    <InputNumber className="w-full" min={0} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={5}>
                                                <Form.Item {...restField} name={[name, 'taxPercent']} label={key === 0 ? "Tax %" : ""} initialValue={0}>
                                                    <InputNumber className="w-full" min={0} max={100} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={2}>
                                                <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} className={key === 0 ? "mt-7" : ""} />
                                            </Col>
                                        </Row>
                                    ))}
                                    <Form.Item>
                                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                            Add Line Item
                                        </Button>
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>
                    </Card>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={() => setIsInvoiceModalVisible(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            {editingInvoice ? "Save Changes" : "Create Invoice"}
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* Payment Modal */}
            <Modal
                title="Record Payment"
                open={isPaymentModalVisible}
                onCancel={() => setIsPaymentModalVisible(false)}
                footer={null}
                destroyOnClose
            >
                <Form layout="vertical" form={paymentForm} onFinish={handlePaymentSubmit} className="mt-4">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="amount" label="Amount Captured" rules={[{ required: true }]}>
                                <InputNumber className="w-full" min={1} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="paymentMethod" label="Payment Method" rules={[{ required: true }]} initialValue="BANK_TRANSFER">
                                <Select>
                                    <Option value="BANK_TRANSFER">Bank Transfer</Option>
                                    <Option value="CASH">Cash</Option>
                                    <Option value="CARD">Card</Option>
                                    <Option value="UPI">UPI</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="referenceNo" label="Reference No / UTR">
                                <Input placeholder="TXN-1234..." />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="paidAt" label="Payment Date" initialValue={dayjs()}>
                                <DatePicker className="w-full" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="notes" label="Notes">
                        <TextArea rows={2} placeholder="Partial payment for..." />
                    </Form.Item>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={() => setIsPaymentModalVisible(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            Record Payment
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}

import { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, message, Tag, Row, Col, Card, Statistic } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

export default function ContributionsList() {
    const { isAdmin, isSuperAdmin } = useAuth();
    const canCreate = isAdmin || isSuperAdmin;

    const [contributions, setContributions] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [admins, setAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    const fetchData = async () => {
        try {
            setLoading(true);
            const [contribRes, summaryRes, adminsRes] = await Promise.all([
                api.get('/contributions?page=1&pageSize=100').catch(() => ({ data: [] })),
                api.get('/contributions/summary').catch(() => ({ data: null })),
                api.get('/admin/users').catch(() => ({ data: [] }))
            ]);

            setContributions(contribRes.data?.data || contribRes.data || []);
            setSummary(summaryRes.data?.data || summaryRes.data || null);
            setAdmins(adminsRes.data?.data || adminsRes.data || []);
        } catch (error) {
            message.error("Failed to fetch contributions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (values: any) => {
        try {
            setSubmitting(true);
            const payload = { ...values };
            if (values.contributionDate) {
                payload.contributionDate = values.contributionDate.toISOString();
            }
            await api.post('/contributions', payload);
            message.success("Contribution recorded successfully!");
            setIsModalVisible(false);
            form.resetFields();
            fetchData();
        } catch (error: any) {
            message.error(error.response?.data?.message || "Failed to record contribution");
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        {
            title: 'Contributor',
            key: 'contributor',
            render: (_: any, record: any) => {
                const admin = admins.find(a => a.publicId === record.contributorId) || record.contributor;
                const name = admin?.profile ? `${admin.profile.firstName} ${admin.profile.lastName}` : (admin?.name || 'Unknown');
                return <span className="font-medium text-gray-800">{name}</span>;
            }
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => {
                let color = 'default';
                if (type === 'EQUITY') color = 'purple';
                if (type === 'LOAN') color = 'orange';
                if (type === 'REVENUE') color = 'green';
                return <Tag color={color}>{type}</Tag>;
            }
        },
        {
            title: 'Amount',
            key: 'amount',
            render: (_: any, record: any) => (
                <span className="font-semibold text-gray-700">
                    {record.currency || 'INR'} {record.amount?.toLocaleString()}
                </span>
            )
        },
        {
            title: 'Date',
            dataIndex: 'contributionDate',
            key: 'date',
            render: (date: string) => date ? dayjs(date).format('MMM D, YYYY') : '-'
        },
        {
            title: 'Reference',
            dataIndex: 'referenceNo',
            key: 'ref',
            render: (text: string) => <span className="text-xs text-gray-500">{text || '-'}</span>
        },
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen w-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-[#405189]">Capital & Contributions</h1>
                {canCreate && (
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={() => setIsModalVisible(true)}
                    >
                        Record Contribution
                    </Button>
                )}
            </div>

            {/* Summary Cards */}
            <Row gutter={16} className="mb-6">
                <Col span={8}>
                    <Card size="small" className="shadow-sm border-gray-100">
                        <Statistic 
                            title="Total Capital Pool" 
                            value={summary?.totalCapital || 0} 
                            prefix="₹" 
                            valueStyle={{ color: '#405189', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card size="small" className="shadow-sm border-gray-100">
                        <Statistic 
                            title="Total Equity" 
                            value={summary?.totalEquity || 0} 
                            prefix="₹" 
                            valueStyle={{ color: '#722ed1', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card size="small" className="shadow-sm border-gray-100">
                        <Statistic 
                            title="Total Loans" 
                            value={summary?.totalLoans || 0} 
                            prefix="₹" 
                            valueStyle={{ color: '#fa8c16', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
            </Row>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <Table 
                    dataSource={contributions} 
                    columns={columns} 
                    rowKey="publicId" 
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </div>

            <Modal
                title="Record Contribution"
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
                destroyOnClose
            >
                <Form layout="vertical" form={form} onFinish={handleSubmit} className="mt-4">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="contributorId" label="Contributor" rules={[{ required: true }]}>
                                <Select placeholder="Select Admin">
                                    {admins.map(a => (
                                        <Option key={a.publicId} value={a.publicId}>
                                            {a.profile?.firstName} {a.profile?.lastName} ({a.email})
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="type" label="Contribution Type" rules={[{ required: true }]}>
                                <Select>
                                    <Option value="EQUITY">Equity / Capital Injection</Option>
                                    <Option value="LOAN">Director/Partner Loan</Option>
                                    <Option value="REVENUE">Direct Revenue</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
                                <InputNumber className="w-full" min={1} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="currency" label="Currency" initialValue="INR">
                                <Select>
                                    <Option value="INR">INR</Option>
                                    <Option value="USD">USD</Option>
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
                            <Form.Item name="contributionDate" label="Date" initialValue={dayjs()}>
                                <DatePicker className="w-full" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="notes" label="Notes">
                        <TextArea rows={2} placeholder="Initial capital requirement..." />
                    </Form.Item>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            Record
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}

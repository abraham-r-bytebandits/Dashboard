import { useState, useEffect } from "react";
import {
    Form,
    Input,
    InputNumber,
    DatePicker,
    Select,
    Button,
    Switch,
    Row,
    Col,
    message,
} from "antd";
import { useNavigate } from "react-router-dom";
import api from '@/api/axios';
import { useAuth } from '@/context/AuthContext';

const { Option } = Select;
const { TextArea } = Input;

type AddExpenseProps = {
    type: "fixed" | "operational";
};

export default function AddExpense({ type }: AddExpenseProps) {
    const { user, isAdmin } = useAuth();
    
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && !isAdmin) {
            message.error("Unauthorized access. Admin role required to add expenses.");
            navigate("/");
        }
    }, [user, isAdmin, navigate]);

    const isFixed = type === "fixed";

    if (!isAdmin) {
        return null; // Return null while redirecting
    }

    const onFinish = async (values: any) => {
        try {
            setLoading(true);
            const payload = {
                expenseType: isFixed ? "FIXED" : "OPERATIONAL",
                title: values.title,
                category: values.category,
                amount: Number(values.amount),
                expenseDate: values.date ? values.date.toISOString() : new Date().toISOString(),
                dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
                status: values.status ? values.status.toUpperCase() : "PENDING",
                recurring: values.recurring || false,
                frequency: values.frequency,
                vendorName: values.vendor,
                paymentMethod: values.paymentMethod,
                notes: values.description,
                paidByPublicId: values.paidBy || undefined,
            };

            await api.post('/expenses', payload);
            message.success('Expense added successfully');
            if (payload.status === "PAID") {
                window.dispatchEvent(new CustomEvent('transactionsUpdated'));
            }
            navigate("/");
        } catch (error: any) {
            console.error('Failed to add expense:', error);
            message.error(error.response?.data?.message || 'Failed to add expense');
        } finally {
            setLoading(false);
        }
    };

    const Card = ({ title, children }: any) => (
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-4">{title}</h3>
            {children}
        </div>
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen w-full">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-[#405189]">
                    {isFixed ? "Add Fixed Expense" : "Add Operational Expense"}
                </h1>
            </div>

            <Form layout="vertical" form={form} onFinish={onFinish}>

                {/* CARD 1 - BASIC */}
                <Card title="Basic Information">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="title" label="Expense Name" rules={[{ required: true }]}>
                                <Input placeholder="AWS Hosting / Salary / Rent" />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                                <Select placeholder="Select category">
                                    {isFixed ? (
                                        <>
                                            <Option value="salaries">Salaries</Option>
                                            <Option value="professional">Professional Fees</Option>
                                        </>
                                    ) : (
                                        <>
                                            <Option value="technology">Technology</Option>
                                            <Option value="utilities">Utilities</Option>
                                        </>
                                    )}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                {/* CARD 2 - FINANCIAL */}
                <Card title="Financial Details">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item name="date" label="Expense Date" rules={[{ required: true }]}>
                                <DatePicker className="w-full" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                {/* CARD 3 - ADDITIONAL */}
                <Card title="Additional Details">
                    {isFixed ? (
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item name="recurring" label="Recurring" valuePropName="checked">
                                    <Switch />
                                </Form.Item>
                            </Col>

                            <Col span={8}>
                                <Form.Item shouldUpdate>
                                    {({ getFieldValue }) =>
                                        getFieldValue("recurring") ? (
                                            <Form.Item name="frequency" label="Frequency" rules={[{ required: true }]}>
                                                <Select>
                                                    <Option value="monthly">Monthly</Option>
                                                    <Option value="yearly">Yearly</Option>
                                                </Select>
                                            </Form.Item>
                                        ) : null
                                    }
                                </Form.Item>
                            </Col>

                            <Col span={8}>
                                <Form.Item name="dueDate" label="Due Date">
                                    <DatePicker className="w-full" />
                                </Form.Item>
                            </Col>
                        </Row>
                    ) : (
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="vendor" label="Vendor">
                                    <Input placeholder="AWS / EB / etc." />
                                </Form.Item>
                            </Col>

                            <Col span={12}>
                                <Form.Item name="paymentMethod" label="Payment Method">
                                    <Select>
                                        <Option value="cash">Cash</Option>
                                        <Option value="bank">Bank Transfer</Option>
                                        <Option value="upi">UPI</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                    )}
                </Card>

                {/* CARD 4 - STATUS */}
                <Card title="Assignment & Status">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="paidBy" label="Paid By">
                                <Select placeholder="Select user" allowClear>
                                    <Option value="0d1df965-ccdc-488d-9b5e-154e8143d619">Abraham Clinton</Option>
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item name="status" label="Status" initialValue="pending">
                                <Select>
                                    <Option value="pending">Pending</Option>
                                    <Option value="paid">Paid</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="description" label="Notes">
                        <TextArea rows={3} placeholder="Add notes..." />
                    </Form.Item>
                </Card>


                <div className="flex items-center justify-end gap-2">
                    <Button onClick={() => navigate("/")}>Cancel</Button>
                    <Button type="primary" onClick={() => form.submit()} loading={loading}>
                        Save Expense
                    </Button>
                </div>

            </Form>
        </div>
    );
}
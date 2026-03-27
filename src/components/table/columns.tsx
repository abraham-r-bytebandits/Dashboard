import { Tag, Avatar, Space, Button, message } from "antd";
import { useState } from "react";
import api from "@/api/axios";
import type { ColumnsType } from "antd/es/table";

export interface Expense {
    id: string;
    publicId: string;
    expenseId: string;
    expenseType: string;
    title: string;
    category: string;
    amount: string;
    dueDate: string;
    status: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
    comments?: string;
    overdueByDays?: number;
    paidBy?: any;
    [key: string]: any;
}

export const getColumns = (
    isAdmin: boolean = false,
    onPaySuccess?: () => void
): ColumnsType<Expense> => {
    const baseColumns: ColumnsType<Expense> = [
        {
            title: "Expense ID",
            dataIndex: "expenseId",
            key: "expenseId",
            render: (id) => <a style={{ color: "#465189", fontWeight: 600 }}>{id}</a>,
        },
        {
            title: "Paid by",
            key: "paidBy",
            render: (_, record) => {
                const profile = record.paidBy?.profile;
                let name = "Business Account";

                if (profile?.firstName || profile?.lastName) {
                    name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
                } else if (record.paidBy?.username) {
                    name = record.paidBy.username.split('@')[0];
                }

                const avatar = profile?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
                return (
                    <Space>
                        <Avatar src={avatar}>{name.charAt(0).toUpperCase()}</Avatar>
                        <span>{name}</span>
                    </Space>
                );
            },
        },
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
            ellipsis: true,
            width: 250,
        },
        {
            title: "Comments",
            dataIndex: "notes",
            key: "notes",
            render: (text) => text || "-",
        },
        {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            render: (amount: string) => (
                <span style={{ color: "#2B8879", fontWeight: 500 }}>₹{Number(amount || 0).toLocaleString()}</span>
            ),
        },
        {
            title: "Due Date",
            dataIndex: "dueDate",
            key: "dueDate",
            render: (dateStr: string) => {
                if (!dateStr) return "-";
                const date = new Date(dateStr);
                return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            }
        },
        {
            title: "Overdue by",
            key: "overdueByDays",
            render: (_, record) => {
                if (record.status === 'PAID') return <span style={{ color: "#10b981", fontWeight: 500 }}>Paid</span>;

                const diffDays = record.overdueByDays || 0;
                if (diffDays <= 0) {
                    return <span style={{ color: "#10b981", fontWeight: 500 }}>Not overdue</span>;
                }
                return <span style={{ color: "#ef4444", fontWeight: 500 }}>{diffDays} days</span>;
            },
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status: Expense["status"]) => {
                let color = "#FF0000";
                let bg = "#F4DADA";
                if (status === "PAID") {
                    color = "#2B8879";
                    bg = "#E6F5F2";
                } else if (status === "APPROVED") {
                    color = "#1D4ED8";
                    bg = "#DBEAFE";
                } else if (status === "PENDING") {
                    color = "#D97706";
                    bg = "#FEF3C7";
                }
                return (
                    <Tag
                        style={{
                            color: color,
                            backgroundColor: bg,
                            border: "none",
                            borderRadius: 6,
                            fontWeight: 500,
                        }}
                    >
                        {status}
                    </Tag>
                );
            },
        }];

    if (isAdmin) {
        baseColumns.push({
            title: "Action",
            key: "action",
            render: (_, record) => {
                const PayButton = () => {
                    const [loading, setLoading] = useState(false);

                    const handlePay = async () => {
                        if (!record.publicId) return;
                        setLoading(true);
                        try {
                            await api.patch(`/expenses/${record.publicId}/pay`);
                            message.success("Expense marked as paid!");
                            onPaySuccess?.();
                            window.dispatchEvent(new CustomEvent('expensePaid'));
                        } catch (err: any) {
                            const msg =
                                err?.response?.data?.message ||
                                "Failed to mark expense as paid";
                            message.error(msg);
                        } finally {
                            setLoading(false);
                        }
                    };

                    return (
                        <Button
                            size="small"
                            loading={loading}
                            disabled={record.status === "PAID" || record.status === "REJECTED" || loading}
                            onClick={handlePay}
                            style={{
                                border: "1px solid black",
                                fontSize: 12,
                                padding: "2px 16px",
                            }}
                        >
                            {record.status === "PAID" ? "Settled" : loading ? "Paying…" : "Pay"}
                        </Button>
                    );
                };

                return <PayButton />;
            },
        });
    }

    return baseColumns;
};

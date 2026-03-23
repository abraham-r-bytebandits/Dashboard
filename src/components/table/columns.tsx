import { Tag, Avatar, Space, Button } from "antd";
import type { ColumnsType } from "antd/es/table";

export interface Invoice {
    key: string;
    invoiceId: string;
    client: {
        name: string;
        avatar: string;
    };
    featureProject: string;
    status: "Pending" | "Paid" | "Overdue";
    amount: string;
    received: string;
    dueDate: string;
    overdueBy: string;
}

export const data: Invoice[] = [
    {
        key: "1",
        invoiceId: "#VZ2112",
        client: { name: "Alex Smith", avatar: "https://i.pravatar.cc/40?img=1" },
        featureProject: "Ecommerce website with new features for thillai wedding silks",
        status: "Pending",
        amount: "₹10,583",
        received: "₹10,583",
        dueDate: "March 24",
        overdueBy: "2 days",
    },
    {
        key: "2",
        invoiceId: "#VZ2112",
        client: { name: "Alex Smith", avatar: "https://i.pravatar.cc/40?img=2" },
        featureProject: "Ecommerce website with new features for thillai wedding silks",
        status: "Pending",
        amount: "₹10,583",
        received: "₹10,583",
        dueDate: "March 23",
        overdueBy: "2 days",
    },
    {
        key: "3",
        invoiceId: "#VZ2112",
        client: { name: "Alex Smith", avatar: "https://i.pravatar.cc/40?img=3" },
        featureProject: "Ecommerce website with new features for thillai wedding silks",
        status: "Pending",
        amount: "₹10,583",
        received: "₹10,583",
        dueDate: "March 23",
        overdueBy: "2 days",
    },
    {
        key: "4",
        invoiceId: "#VZ2112",
        client: { name: "Alex Smith", avatar: "https://i.pravatar.cc/40?img=4" },
        featureProject: "Ecommerce website with new features for thillai wedding silks",
        status: "Pending",
        amount: "₹10,583",
        received: "₹10,583",
        dueDate: "March 23",
        overdueBy: "2 days",
    },
    {
        key: "5",
        invoiceId: "#VZ2112",
        client: { name: "Alex Smith", avatar: "https://i.pravatar.cc/40?img=5" },
        featureProject: "Ecommerce website with new features for thillai wedding silks",
        status: "Pending",
        amount: "₹10,583",
        received: "₹10,583",
        dueDate: "March 23",
        overdueBy: "2 days",
    },
];

export const columns: ColumnsType<Invoice> = [
    {
        title: "Invoice ID",
        dataIndex: "invoiceId",
        key: "invoiceId",
        render: (id) => <a style={{ color: "#465189", fontWeight: 600 }}>{id}</a>,
    },
    {
        title: "Client Name",
        dataIndex: "client",
        key: "client",
        render: (client) => (
            <Space>
                <Avatar src={client.avatar} />
                <span>{client.name}</span>
            </Space>
        ),
    },
    {
        title: "Feature / Project",
        dataIndex: "featureProject",
        key: "featureProject",
        ellipsis: true,
        width: 280,
    },
    {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status: Invoice["status"]) => {
            return (
                <Tag
                    style={{
                        color: "#FF0000",
                        backgroundColor: "#F4DADA",
                        border: "none",
                        borderRadius: 6,
                        fontWeight: 500,
                    }}
                >
                    {status}
                </Tag>
            );
        },
    },
    {
        title: "Amount",
        dataIndex: "amount",
        key: "amount",
        render: (amount: string) => (
            <span style={{ color: "#2B8879", fontWeight: 500 }}>{amount}</span>
        ),
    },
    {
        title: "Received",
        dataIndex: "received",
        key: "received",
        render: (received: string) => (
            <span style={{ color: "#2B8879", fontWeight: 500 }}>{received}</span>
        ),
    },
    {
        title: "Due Date",
        dataIndex: "dueDate",
        key: "dueDate",
    },
    {
        title: "Overdue by",
        dataIndex: "overdueBy",
        key: "overdueBy",
        render: (text: string) => (
            <span style={{ color: "#ef4444", fontWeight: 500 }}>{text}</span>
        ),
    },
    {
        title: "Action",
        key: "action",
        render: () => (
            <Button
                size="small"
                style={{
                    border: "1px solid black",
                    fontSize: 12,
                    padding: "2px 16px",
                }}
            >
                Paid
            </Button>
        ),
    },
];

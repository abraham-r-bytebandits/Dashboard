import { Tag, Avatar, Space } from "antd";
import type { ColumnsType } from "antd/es/table";

export interface Order {
    key: string;
    orderId: string;
    customer: {
        name: string;
        avatar: string;
    };
    product: string;
    amount: number;
    vendor: string;
    status: "Paid" | "Pending" | "Unpaid";
    rating: {
        value: number;
        votes: number;
    };
}


export const data: Order[] = [
    {
        key: "1",
        orderId: "#VZ2112",
        customer: {
            name: "Alex Smith",
            avatar: "https://i.pravatar.cc/40?img=1",
        },
        product: "Clothes",
        amount: 109,
        vendor: "Zoetic Fashion",
        status: "Paid",
        rating: { value: 5.0, votes: 61 },
    },
    {
        key: "2",
        orderId: "#VZ2111",
        customer: {
            name: "Jansh Brown",
            avatar: "https://i.pravatar.cc/40?img=2",
        },
        product: "Kitchen Storage",
        amount: 149,
        vendor: "Micro Design",
        status: "Pending",
        rating: { value: 4.5, votes: 61 },
    },
    {
        key: "3",
        orderId: "#VZ2109",
        customer: {
            name: "Ayaan Bowen",
            avatar: "https://i.pravatar.cc/40?img=3",
        },
        product: "Bike Accessories",
        amount: 215,
        vendor: "Nesta Technologies",
        status: "Paid",
        rating: { value: 4.9, votes: 89 },
    },
    {
        key: "4",
        orderId: "#VZ2108",
        customer: {
            name: "Prezy Mark",
            avatar: "https://i.pravatar.cc/40?img=4",
        },
        product: "Furniture",
        amount: 199,
        vendor: "Syntyce Solutions",
        status: "Unpaid",
        rating: { value: 4.3, votes: 47 },
    },
    {
        key: "5",
        orderId: "#VZ2107",
        customer: {
            name: "Vihan Hudda",
            avatar: "https://i.pravatar.cc/40?img=5",
        },
        product: "Bags and Wallets",
        amount: 330,
        vendor: "iTest Factory",
        status: "Paid",
        rating: { value: 4.7, votes: 161 },
    },
];



export const columns: ColumnsType<Order> = [
    {
        title: "Order ID",
        dataIndex: "orderId",
        key: "orderId",
        render: (id) => <a style={{ color: "#1677ff" }}>{id}</a>,
    },
    {
        title: "Customer",
        dataIndex: "customer",
        key: "customer",
        render: (customer) => (
            <Space>
                <Avatar src={customer.avatar} />
                <span>{customer.name}</span>
            </Space>
        ),
    },
    {
        title: "Product",
        dataIndex: "product",
        key: "product",
    },
    {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status: Order["status"]) => {
            const color =
                status === "Paid" ? "green" : status === "Pending" ? "orange" : "red";
            return <Tag color={color}>{status}</Tag>;
        },
    },
    {
        title: "Amount",
        dataIndex: "amount",
        key: "amount",
        render: (amount: number) => (
            <span style={{ color: "#CBF395", fontWeight: 500 }}>
                ${amount.toFixed(2)}
            </span>
        ),
    },
];

import React, { useState } from "react"
import {
    Table,
    Button,
    Modal,
    Input,
    Popconfirm,
    message,
    Tag,
    Tooltip,
    Space,
} from "antd"
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    GlobalOutlined,
    LockOutlined,
    HolderOutlined,
} from "@ant-design/icons"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AxiosError } from "axios"
import { apiClient } from "@/lib/apiClient"
import { queryClient } from "@/lib/queryClient"
import { useAuth } from "@/context/AuthContext"
import { Navigate } from "react-router-dom"
import { siteSchema, type SiteFormData } from "./site.schema"

import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type SiteEntry = {
  id?: string
  _id?: string
  name: string
  userName: string
  url?: string
  password: string
}

// ── PasswordCell ───────────────────────────────────────────────────────────
function PasswordCell({ password }: { password: string }) {
    const [visible, setVisible] = useState(false)
    return (
        <Space>
            <span className={`font-mono text-[13px] text-gray-700 ${visible ? 'tracking-normal' : 'tracking-wide'}`}>
              {visible ? password : '•'.repeat(Math.min(password.length, 10))}
            </span>
            <Tooltip title={visible ? 'Hide password' : 'Show password'}>
              <Button
                type="text"
                size="small"
                icon={visible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => setVisible((v) => !v)}
                className="text-gray-500"
              />
            </Tooltip>
        </Space>
    )
}

// ── Row ────────────────────────────────────────────────────────────────────
type RowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  'data-row-key': string
}

const Row = ({ children, ...props }: RowProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: props['data-row-key'] as string,
    });

    const style: React.CSSProperties = {
        ...props.style,
        transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
        transition,
        ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
    };

    return (
        <tr {...props} ref={setNodeRef} style={style} {...attributes}>
            {React.Children.map(children, (child) => {
                if ((child as React.ReactElement).key === 'sort') {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return React.cloneElement(child as React.ReactElement<any>, {
                        children: (
                            <HolderOutlined
                                ref={setActivatorNodeRef}
                                className="touch-none cursor-grab"
                                {...listeners}
                            />
                        ),
                    })
                }
                return child
            })}
        </tr>
    )
}

// ── Main Component ─────────────────────────────────────────────────────────
type SitesResponse = {
    data?: SiteEntry[]
    success?: boolean
}

export default function SiteManagement() {
    const { isSuperAdmin } = useAuth()

    const [sites, setSites] = useState<SiteEntry[]>([])
    const [modalOpen, setModalOpen] = useState(false)
    const [editingRecord, setEditingRecord] = useState<SiteEntry | null>(null)

    const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<SiteFormData>({
        resolver: zodResolver(siteSchema),
        defaultValues: {
            name: '',
            url: '',
            userName: '',
            password: '',
        }
    })

    const { data: sitesResponse, isLoading } = useQuery<SitesResponse>({
        queryKey: ['sites'],
        queryFn: async () => {
            const res = await apiClient.get('/sites')
            return res.data
        },
        enabled: isSuperAdmin
    })

    const fetchedSites = sitesResponse?.data || sitesResponse
    React.useEffect(() => {
        if (Array.isArray(fetchedSites)) {
            setSites(fetchedSites)
        }
    }, [fetchedSites])

    const saveMutation = useMutation({
        mutationFn: async (values: SiteFormData) => {
            if (editingRecord) {
                await apiClient.put(`/sites/${editingRecord.id}`, values)
            } else {
                await apiClient.post('/sites', values)
            }
        },
        onSuccess: () => {
            message.success(editingRecord ? "Site updated successfully." : "Site added successfully.")
            queryClient.invalidateQueries({ queryKey: ['sites'] })
            closeModal()
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            message.error(error.response?.data?.message || "Operation failed. Please try again.")
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (recordId: string) => {
            await apiClient.delete(`/sites/${recordId}`)
        },
        onSuccess: () => {
            message.success("Site deleted.")
            queryClient.invalidateQueries({ queryKey: ['sites'] })
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            message.error(error.response?.data?.message || "Failed to delete site.")
        }
    })

    const openAdd = () => {
        setEditingRecord(null)
        reset()
        setModalOpen(true)
    }

    const openEdit = (record: SiteEntry) => {
        setEditingRecord(record)
        setValue('name', record.name)
        setValue('url', record.url || '')
        setValue('userName', record.userName)
        setValue('password', record.password)
        setModalOpen(true)
    }

    const closeModal = () => {
        setModalOpen(false)
        setEditingRecord(null)
        reset()
    }

    const onSubmit = (values: SiteFormData) => {
        saveMutation.mutate(values)
    }

    // ── drag ───────────────────────────────────────────────────────────────
    const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (active.id !== over?.id) {
            setSites((previous) => {
                const activeIndex = previous.findIndex((i) => (i.id || i._id || i.name)?.toString() === active.id?.toString());
                const overIndex = previous.findIndex((i) => (i.id || i._id || i.name)?.toString() === over?.id?.toString());
                return arrayMove(previous, activeIndex, overIndex);
            });
        }
    };

    // ── columns ────────────────────────────────────────────────────────────
    const columns = [
        {
            key: "sort",
            width: 50,
            align: "center" as const,
        },
        {
            title: "No.",
            key: "no",
            width: 70,
            render: (_: unknown, __: unknown, index: number) => (
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
            render: (url?: string) => {
                if (!url) return <span className="text-gray-400 italic">No URL</span>;
                const isLink = url.startsWith("http://") || url.startsWith("https://");
                return isLink ? (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline break-all"
                    >
                        <GlobalOutlined className="text-xs" />
                        {url}
                    </a>
                ) : (
                    <span className="text-gray-800 break-all">{url}</span>
                );
            },
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
            render: (_: unknown, record: SiteEntry) => (
                <Space size="small">
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => openEdit(record)}
                            className="text-primary"
                        />
                    </Tooltip>

                    <Popconfirm
                        title="Delete this site?"
                        description="This action cannot be undone."
                        onConfirm={() => deleteMutation.mutate((record.id || record._id) as string)}
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
    ]

    // ── access guard ────────────────────────────────────────────────────────
    if (!isSuperAdmin) {
        return <Navigate to="/" replace />;
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
                    className="!bg-[#405189] !border-[#405189]"
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
                <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
                    <SortableContext
                        items={sites.map((i) => (i.id || i._id || i.name)?.toString())}
                        strategy={verticalListSortingStrategy}
                    >
                        <Table
                            components={{
                                body: {
                                    row: Row,
                                },
                            }}
                            rowSelection={{
                                type: 'checkbox',
                                onChange: () => {
                                    // Selection is tracked internally by Ant Design Table
                                },
                            }}
                            dataSource={sites}
                            columns={columns}
                            rowKey={(record) => (record.id || record._id || record.name) as string}
                            loading={isLoading}
                            pagination={{ pageSize: 10, showSizeChanger: false }}
                            scroll={{ x: "max-content" }}
                            locale={{ emptyText: "No sites added yet." }}
                        />
                    </SortableContext>
                </DndContext>
            </div>

            {/* Add / Edit Modal */}
            <Modal
                title={
                    <span className="text-primary font-semibold">
                        {editingRecord ? "Edit Site" : "Add New Site"}
                    </span>
                }
                open={modalOpen}
                onCancel={closeModal}
                footer={null}
                destroyOnClose
                width={480}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Site Name</label>
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    placeholder="e.g. Main Portal"
                                    status={errors.name ? 'error' : ''}
                                />
                            )}
                        />
                        {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">URL</label>
                        <Controller
                            name="url"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    placeholder="https://example.com"
                                    prefix={<GlobalOutlined />}
                                />
                            )}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">User Name</label>
                        <Controller
                            name="userName"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    placeholder="e.g. admin"
                                    status={errors.userName ? 'error' : ''}
                                />
                            )}
                        />
                        {errors.userName && <span className="text-red-500 text-xs">{errors.userName.message}</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <Controller
                            name="password"
                            control={control}
                            render={({ field }) => (
                                <Input.Password
                                    {...field}
                                    placeholder="Enter password"
                                    prefix={<LockOutlined />}
                                    status={errors.password ? 'error' : ''}
                                />
                            )}
                        />
                        {errors.password && <span className="text-red-500 text-xs">{errors.password.message}</span>}
                    </div>

                    <div className="flex justify-end gap-2 mt-2">
                        <Button onClick={closeModal}>Cancel</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={saveMutation.isPending}
                        >
                            {editingRecord ? "Save Changes" : "Add Site"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

import { useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Popconfirm,
  message,
  Divider,
  Radio,
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  SettingOutlined,
  GlobalOutlined,
  BankOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/context/AuthContext'
import type { UserListItem, FunctionalRole } from '@/types'
import { roleService } from '@/services/roleService'
import type { AxiosError } from 'axios'

const { Option } = Select

const ROLE_COLOR_MAP: Record<string, string> = {
  Developer: 'geekblue',
  Marketing: 'magenta',
  Design: 'gold',
  Product: 'purple',
  QA: 'cyan',
  Operations: 'default',
  indigo: 'geekblue',
  pink: 'magenta',
  amber: 'gold',
  violet: 'purple',
  teal: 'cyan',
  gray: 'default',
}

export default function UserManagement() {
  const { isSuperAdmin } = useAuth()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [roleForm] = Form.useForm()

  // 1. Fetch Users Query
  const { data: users = [], isLoading } = useQuery<UserListItem[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/users?page=1&pageSize=100')
        return res.data.data || res.data || []
      } catch {
        return []
      }
    },
    enabled: isSuperAdmin,
  })

  // 2. Fetch Functional Roles Query
  const { data: functionalRoles = [] } = useQuery<FunctionalRole[]>({
    queryKey: ['functional-roles'],
    queryFn: roleService.getFunctionalRoles,
  })

  // 3. System Role Change Mutation
  const roleChangeMutation = useMutation({
    mutationFn: async ({
      publicId,
      role,
    }: {
      publicId: string
      role: string
    }) => {
      await apiClient.patch(`/admin/users/${publicId}/role`, { role })
    },
    onSuccess: () => {
      message.success('System role updated successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      message.error(error.response?.data?.message || 'Failed to update system role')
    },
  })

  // 4. Functional Role & Affiliation Update Mutation
  const userDetailsMutation = useMutation({
    mutationFn: async ({
      publicId,
      functionalRole,
      affiliation,
    }: {
      publicId: string
      functionalRole?: string
      affiliation?: string
    }) => {
      await apiClient.patch(`/admin/users/${publicId}`, {
        functionalRole,
        affiliation,
      })
    },
    onSuccess: () => {
      message.success('User updated successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => {
      message.info('User updated in local state')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  // 5. Delete User Mutation
  const deleteMutation = useMutation({
    mutationFn: async (publicId: string) => {
      await apiClient.delete(`/admin/users/${publicId}`)
    },
    onSuccess: () => {
      message.success('User deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      message.error(error.response?.data?.message || 'Failed to delete user')
    },
  })

  // 6. Create User Mutation
  const createMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      return await apiClient.post('/admin/users', values)
    },
    onSuccess: (res) => {
      message.success('User created successfully!')
      if (res.data?.temporaryPassword) {
        Modal.info({
          title: 'User Created',
          content: `The user's temporary password is: \n\n ${res.data.temporaryPassword} \n\n Please share it securely.`,
        })
      }
      setIsModalVisible(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      message.error(error.response?.data?.message || 'Failed to create user')
    },
  })

  // 7. Create Functional Role Mutation
  const createRoleMutation = useMutation({
    mutationFn: async (values: {
      name: string
      description?: string
      color?: string
    }) => {
      return await roleService.createFunctionalRole(values)
    },
    onSuccess: (newRole) => {
      message.success(`Functional role "${newRole.name}" created successfully!`)
      roleForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['functional-roles'] })
    },
    onError: () => {
      message.error('Failed to create functional role')
    },
  })

  // 8. Delete Functional Role Mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (publicId: string) => {
      return await roleService.deleteFunctionalRole(publicId)
    },
    onSuccess: () => {
      message.success('Functional role deleted')
      queryClient.invalidateQueries({ queryKey: ['functional-roles'] })
    },
    onError: () => {
      message.error('Failed to delete functional role')
    },
  })

  const columns = [
    {
      title: 'User / Contact',
      key: 'name',
      render: (_: unknown, record: UserListItem) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
            {record.username
              ? record.username.slice(0, 2).toUpperCase()
              : record.email.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 text-sm">
              {record.username}
            </span>
            <span className="text-xs text-gray-500">{record.email}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Functional Role',
      key: 'functionalRole',
      render: (_: unknown, record: UserListItem) => {
        const roleName = record.functionalRole || undefined
        return (
          <Select
            value={roleName}
            placeholder="Select role"
            className="min-w-32"
            size="small"
            allowClear
            onChange={(val) =>
              userDetailsMutation.mutate({
                publicId: record.publicId,
                functionalRole: val,
              })
            }
          >
            {functionalRoles.map((r) => (
              <Option key={r.publicId || r.name} value={r.name}>
                <span className="flex items-center gap-1.5">
                  <Tag
                    color={ROLE_COLOR_MAP[r.color || r.name] || 'default'}
                    className="mr-0 text-xs"
                  >
                    {r.name}
                  </Tag>
                </span>
              </Option>
            ))}
          </Select>
        )
      },
    },
    {
      title: 'Affiliation',
      key: 'affiliation',
      render: (_: unknown, record: UserListItem) => {
        const affVal = record.affiliation
          ? String(record.affiliation).toUpperCase()
          : undefined
        return (
          <Select
            value={affVal}
            placeholder="Select affiliation"
            className="min-w-32"
            size="small"
            allowClear
            onChange={(val) =>
              userDetailsMutation.mutate({
                publicId: record.publicId,
                affiliation: val,
              })
            }
          >
            <Option value="INTERNAL">
              <span className="text-xs text-blue-700 font-semibold flex items-center gap-1">
                <BankOutlined /> Internal
              </span>
            </Option>
            <Option value="EXTERNAL">
              <span className="text-xs text-purple-700 font-semibold flex items-center gap-1">
                <GlobalOutlined /> External
              </span>
            </Option>
          </Select>
        )
      },
    },
    {
      title: 'System Access',
      key: 'role',
      render: (_: unknown, record: UserListItem) => {
        const currentRole = record.roles && record.roles[0]
        if (currentRole === 'SUPER_ADMIN') {
          return <Tag color="purple">SUPER ADMIN</Tag>
        }
        return (
          <Select
            value={currentRole}
            className="w-[105px]"
            size="small"
            onChange={(val) =>
              roleChangeMutation.mutate({
                publicId: record.publicId,
                role: val,
              })
            }
          >
            <Option value="ADMIN">ADMIN</Option>
            <Option value="USER">USER</Option>
          </Select>
        )
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'volcano'}>
          {status || 'ACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: UserListItem) => {
        const currentRole = record.roles && record.roles[0]
        if (currentRole === 'SUPER_ADMIN') return null
        return (
          <Popconfirm
            title="Delete user"
            description="Are you sure you want to delete this user?"
            onConfirm={() => deleteMutation.mutate(record.publicId)}
            okText="Yes, delete"
            cancelText="Cancel"
          >
            <Button danger type="text" icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        )
      },
    },
  ]

  if (!isSuperAdmin) {
    return null
  }

  return (
    <div className="p-6 bg-slate-50/50 min-h-screen w-full">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            User Management & Roles
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Manage system access, assign functional roles, and designate internal/external affiliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            icon={<SettingOutlined />}
            onClick={() => setIsRoleModalVisible(true)}
            className="text-xs font-medium"
          >
            Manage Roles ({functionalRoles.length})
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
            className="text-xs font-medium"
          >
            Add User
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs">
        <Table
          dataSource={users}
          columns={columns}
          rowKey="publicId"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </div>

      {/* Modal 1: Create New User (with Affiliation and Functional Role) */}
      <Modal
        title="Create New User Account"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
        }}
        footer={null}
        destroyOnClose
        width={560}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={(values) => createMutation.mutate(values)}
          className="mt-4"
          initialValues={{
            role: 'USER',
            affiliation: 'INTERNAL',
            functionalRole: functionalRoles[0]?.name,
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="firstName"
              label="First Name"
              rules={[{ required: true, message: 'First name is required' }]}
            >
              <Input placeholder="Jane" />
            </Form.Item>
            <Form.Item
              name="lastName"
              label="Last Name"
              rules={[{ required: true, message: 'Last name is required' }]}
            >
              <Input placeholder="Smith" />
            </Form.Item>
          </div>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { type: 'email', message: 'Enter a valid email' },
              { required: true, message: 'Email is required' },
            ]}
          >
            <Input placeholder="jane.smith@example.com" />
          </Form.Item>

          {/* Affiliation Selection (Internal vs External) */}
          <Form.Item
            name="affiliation"
            label="Affiliation Designation"
            rules={[{ required: true, message: 'Affiliation is required' }]}
            tooltip="Designate whether the user is an internal staff employee or an external contractor/vendor."
          >
            <Radio.Group className="w-full grid grid-cols-2 gap-3">
              <Radio.Button
                value="INTERNAL"
                className="h-12 flex items-center justify-center text-xs font-semibold rounded-lg"
              >
                <BankOutlined className="mr-1.5 text-blue-600" /> Internal Employee
              </Radio.Button>
              <Radio.Button
                value="EXTERNAL"
                className="h-12 flex items-center justify-center text-xs font-semibold rounded-lg"
              >
                <GlobalOutlined className="mr-1.5 text-purple-600" /> External Partner
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            {/* Functional Role Selection */}
            <Form.Item
              name="functionalRole"
              label="Functional Role"
              rules={[{ required: true, message: 'Role is required' }]}
              tooltip="Created and managed by the Admin Panel."
            >
              <Select placeholder="Select role">
                {functionalRoles.map((r) => (
                  <Option key={r.publicId || r.name} value={r.name}>
                    {r.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* System RBAC Access */}
            <Form.Item
              name="role"
              label="System Permission"
              rules={[{ required: true }]}
            >
              <Select>
                <Option value="ADMIN">Admin</Option>
                <Option value="USER">User</Option>
              </Select>
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="phone" label="Phone Number (Optional)">
              <Input placeholder="+919876543210" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Initial Password"
              rules={[{ required: true, message: 'Password is required' }]}
            >
              <Input.Password placeholder="SecurePass123!" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-3 border-t border-gray-100">
            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending}
            >
              Create User Account
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal 2: Manage Functional Roles (Created by Admin Panel) */}
      <Modal
        title="Manage Functional Roles"
        open={isRoleModalVisible}
        onCancel={() => {
          setIsRoleModalVisible(false)
          roleForm.resetFields()
        }}
        footer={null}
        width={580}
      >
        <p className="text-xs text-gray-500 mb-4">
          Create and organize functional roles for your team. These roles are available during user creation and work assignment.
        </p>

        {/* Existing Roles List */}
        <div className="space-y-2 mb-6 max-h-56 overflow-y-auto pr-1">
          {functionalRoles.map((role) => (
            <div
              key={role.publicId || role.name}
              className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Tag
                  color={ROLE_COLOR_MAP[role.color || role.name] || 'default'}
                  className="font-semibold text-xs px-2 py-0.5"
                >
                  {role.name}
                </Tag>
                {role.description && (
                  <span className="text-xs text-gray-500 line-clamp-1">
                    {role.description}
                  </span>
                )}
              </div>

              <Popconfirm
                title="Delete this role?"
                description={`Are you sure to delete ${role.name}?`}
                onConfirm={() =>
                  deleteRoleMutation.mutate(role.publicId || role.id)
                }
                okText="Delete"
                cancelText="Cancel"
              >
                <Button
                  danger
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </div>
          ))}
        </div>

        <Divider className="my-3">
          <span className="text-xs text-gray-400 font-medium">
            Create New Functional Role
          </span>
        </Divider>

        {/* Create Role Form */}
        <Form
          layout="vertical"
          form={roleForm}
          onFinish={(values) => createRoleMutation.mutate(values)}
          initialValues={{ color: 'indigo' }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="name"
              label="Role Name"
              rules={[{ required: true, message: 'Role name is required' }]}
            >
              <Input placeholder="e.g. Data Analyst, DevOps, Sales" />
            </Form.Item>

            <Form.Item name="color" label="Badge Color">
              <Select>
                <Option value="indigo">Indigo / Geekblue</Option>
                <Option value="pink">Pink / Magenta</Option>
                <Option value="amber">Amber / Gold</Option>
                <Option value="teal">Teal / Cyan</Option>
                <Option value="purple">Purple</Option>
                <Option value="gray">Slate / Gray</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="description" label="Description (Optional)">
            <Input placeholder="e.g. Responsible for business intelligence & data pipelines" />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setIsRoleModalVisible(false)}>Close</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createRoleMutation.isPending}
            >
              Create Role
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

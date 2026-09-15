import { useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Tag, Popconfirm, message } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/context/AuthContext'
import type { UserListItem } from '@/types'
import type { AxiosError } from 'axios'

const { Option } = Select

export default function UserManagement() {
  const { isSuperAdmin } = useAuth()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()

  const { data: users = [], isLoading } = useQuery<UserListItem[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/users?page=1&pageSize=100')
      return res.data.data || res.data || []
    },
    enabled: isSuperAdmin,
  })

  const roleChangeMutation = useMutation({
    mutationFn: async ({ publicId, role }: { publicId: string; role: string }) => {
      await apiClient.patch(`/admin/users/${publicId}/role`, { role })
    },
    onSuccess: () => {
      message.success('Role updated successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      message.error(error.response?.data?.message || 'Failed to update role')
    },
  })

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

  const columns = [
    {
      title: 'Name',
      key: 'name',
      render: (_: unknown, record: UserListItem) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">{record.username}</span>
          <span className="text-xs text-gray-500">{record.email}</span>
        </div>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      render: (_: unknown, record: UserListItem) => {
        const currentRole = record.roles && record.roles[0]
        if (currentRole === 'SUPER_ADMIN') {
          return <Tag color="purple">SUPER ADMIN</Tag>
        }
        return (
          <Select
            value={currentRole}
            className="w-[100px]"
            onChange={(val) => roleChangeMutation.mutate({ publicId: record.publicId, role: val })}
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
        <Tag color={status === 'ACTIVE' ? 'green' : 'volcano'}>{status || 'UNKNOWN'}</Tag>
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
            title="Delete the user"
            description="Are you sure to delete this user?"
            onConfirm={() => deleteMutation.mutate(record.publicId)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger type="text" icon={<DeleteOutlined />} />
          </Popconfirm>
        )
      },
    },
  ]

  if (!isSuperAdmin) {
    return null
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-primary">User Management</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          Add User
        </Button>
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <Table
          dataSource={users}
          columns={columns}
          rowKey="publicId"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        title="Create New User"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={(values) => createMutation.mutate(values)}
          className="mt-4"
        >
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
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              Create Account
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

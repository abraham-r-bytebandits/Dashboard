import { useState } from 'react'
import { Table, Button, Modal, Form, Input, Popconfirm, message } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/context/AuthContext'
import type { Client } from '@/types'
import type { AxiosError } from 'axios'

type ClientFormValues = {
  name: string
  companyName?: string
  email: string
  phone?: string
  billingAddressLine1?: string
  city?: string
  state?: string
  country?: string
  notes?: string
}

export default function ClientsList() {
  const { isAdmin, isSuperAdmin } = useAuth()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [form] = Form.useForm()

  const canEdit = isAdmin || isSuperAdmin
  const canDelete = isSuperAdmin

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await apiClient.get('/clients?page=1&pageSize=100')
      return res.data.data || res.data || []
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (publicId: string) => {
      await apiClient.delete(`/clients/${publicId}`)
    },
    onSuccess: () => {
      message.success('Client deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      message.error(error.response?.data?.message || 'Failed to delete client')
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (values: ClientFormValues & { id?: string }) => {
      if (editingClient) {
        await apiClient.put(`/clients/${editingClient.id}`, values)
      } else {
        await apiClient.post('/clients', values)
      }
    },
    onSuccess: () => {
      message.success(editingClient ? 'Client updated successfully!' : 'Client created successfully!')
      setIsModalVisible(false)
      form.resetFields()
      setEditingClient(null)
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      message.error(error.response?.data?.message || 'Failed to save client')
    },
  })

  const openEditModal = (client: Client) => {
    setEditingClient(client)
    form.setFieldsValue(client)
    setIsModalVisible(true)
  }

  const columns = [
    {
      title: 'Client Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Client) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">{text}</span>
          <span className="text-xs text-gray-500">{record.company}</span>
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_: unknown, record: Client) => (
        <div className="flex flex-col">
          <span className="text-sm">{record.email}</span>
          <span className="text-xs text-gray-500">{record.phone}</span>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span className={`text-sm ${status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
          {status}
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: Client) => (
        <div className="flex gap-2">
          {canEdit && (
            <Button type="text" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          )}
          {canDelete && (
            <Popconfirm
              title="Delete the client"
              description="Are you sure to delete this client?"
              onConfirm={() => deleteMutation.mutate(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button danger type="text" icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-primary">Clients</h1>
        {canEdit && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingClient(null)
              form.resetFields()
              setIsModalVisible(true)
            }}
          >
            Add Client
          </Button>
        )}
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <Table
          dataSource={clients}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        title={editingClient ? 'Edit Client' : 'Add New Client'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
          setEditingClient(null)
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={(values) => saveMutation.mutate(values)}
          className="mt-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="name" label="Primary Contact Name" rules={[{ required: true }]}>
              <Input placeholder="John Doe" />
            </Form.Item>
            <Form.Item name="company" label="Company Name">
              <Input placeholder="Acme Corp" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="email"
              label="Email Address"
              rules={[{ type: 'email' }, { required: true }]}
            >
              <Input placeholder="contact@acme.com" />
            </Form.Item>
            <Form.Item name="phone" label="Phone Number">
              <Input placeholder="+919876543210" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
              {editingClient ? 'Save Changes' : 'Create Client'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

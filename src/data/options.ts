import type { SelectOption } from '@/types'

export const EXPENSE_TYPE_OPTIONS = [
  { label: 'Fixed Cost', value: 'fixed' },
  { label: 'Operational Cost', value: 'operational' },
] satisfies SelectOption[]

export const CLIENT_STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Pending', value: 'pending' },
] satisfies SelectOption[]

export const INVOICE_STATUS_OPTIONS = [
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Paid', value: 'paid' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Cancelled', value: 'cancelled' },
] satisfies SelectOption[]

export const MESSAGE_STATUS_OPTIONS = [
  { label: 'New', value: 'new' },
  { label: 'Read', value: 'read' },
  { label: 'Replied', value: 'replied' },
  { label: 'Archived', value: 'archived' },
] satisfies SelectOption[]

export const USER_ROLE_OPTIONS = [
  { label: 'Super Admin', value: 'SUPER_ADMIN' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'User', value: 'USER' },
] satisfies SelectOption[]

export const USER_STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Suspended', value: 'suspended' },
] satisfies SelectOption[]

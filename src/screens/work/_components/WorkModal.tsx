import { Modal, Input, Select, DatePicker } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Textarea } from '@/components/ui/textarea'
import type { WorkItem, Assignee, Priority, WorkStatus } from '@/types/work'
import dayjs from 'dayjs'

const workItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['new', 'todo', 'clarifications', 'under_analysis', 'approval']),
  dueDate: z.string(),
  assignees: z.array(z.string()),
  milestoneCompleted: z.number().min(0),
  milestoneTotal: z.number().min(1),
})

type WorkItemFormValues = z.infer<typeof workItemSchema>

type WorkModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (values: WorkItemFormValues) => void
  initialData?: WorkItem | null
  teamDirectory: Assignee[]
}

const PRIORITY_OPTIONS = [
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
]

const STATUS_OPTIONS = [
  { label: 'New', value: 'new' },
  { label: 'To do', value: 'todo' },
  { label: 'Clarifications / Doubts', value: 'clarifications' },
  { label: 'Under analysis', value: 'under_analysis' },
  { label: 'Approval', value: 'approval' },
]

export function WorkModal({ open, onClose, onSubmit, initialData, teamDirectory }: WorkModalProps) {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<WorkItemFormValues>({
    resolver: zodResolver(workItemSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          description: initialData.description,
          priority: initialData.priority,
          status: initialData.status,
          dueDate: initialData.dueDate,
          assignees: initialData.assignees.map(a => a.id),
          milestoneCompleted: initialData.milestone.completed,
          milestoneTotal: initialData.milestone.total,
        }
      : {
          title: '',
          description: '',
          priority: 'medium' as Priority,
          status: 'new' as WorkStatus,
          dueDate: new Date().toISOString().split('T')[0],
          assignees: [],
          milestoneCompleted: 0,
          milestoneTotal: 1,
        },
  })

  const handleFormSubmit = (values: WorkItemFormValues) => {
    onSubmit(values)
    reset()
    onClose()
  }

  const handleCancel = () => {
    reset()
    onClose()
  }

  const assigneeOptions = teamDirectory.map(member => ({
    label: `${member.name} - ${member.role} (${member.affiliation})`,
    value: member.id,
  }))

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      title={initialData ? 'Edit Task' : 'Create Task'}
      okText={initialData ? 'Update' : 'Create'}
      onOk={handleSubmit(handleFormSubmit)}
      width={600}
    >
      <form className="space-y-4 py-4">
        <div>
          <label className="text-foreground mb-1 block text-sm font-medium">Title</label>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="Enter task title" status={errors.title ? 'error' : ''} />
            )}
          />
          {errors.title && <p className="text-destructive mt-1 text-xs">{errors.title.message}</p>}
        </div>

        <div>
          <label className="text-foreground mb-1 block text-sm font-medium">Description</label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea {...field} placeholder="Enter task description" rows={3} />
            )}
          />
          {errors.description && <p className="text-destructive mt-1 text-xs">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-foreground mb-1 block text-sm font-medium">Priority</label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Select {...field} options={PRIORITY_OPTIONS} className="w-full" />
              )}
            />
          </div>

          <div>
            <label className="text-foreground mb-1 block text-sm font-medium">Status</label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select {...field} options={STATUS_OPTIONS} className="w-full" />
              )}
            />
          </div>
        </div>

        <div>
          <label className="text-foreground mb-1 block text-sm font-medium">Due Date</label>
          <Controller
            name="dueDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value ? dayjs(field.value) : null}
                onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                className="w-full"
                format="YYYY-MM-DD"
              />
            )}
          />
        </div>

        <div>
          <label className="text-foreground mb-1 block text-sm font-medium">Assignees</label>
          <Controller
            name="assignees"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                mode="multiple"
                options={assigneeOptions}
                className="w-full"
                placeholder="Select assignees"
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-foreground mb-1 block text-sm font-medium">Milestone Completed</label>
            <Controller
              name="milestoneCompleted"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="number"
                  min={0}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              )}
            />
          </div>

          <div>
            <label className="text-foreground mb-1 block text-sm font-medium">Milestone Total</label>
            <Controller
              name="milestoneTotal"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="number"
                  min={1}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              )}
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}

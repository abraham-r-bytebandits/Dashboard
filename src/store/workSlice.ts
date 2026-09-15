import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { WorkItem, Assignee, Priority, WorkStatus, UserRole, UserAffiliation } from '@/types/work'
import { MOCK_WORK_ITEMS, TEAM_DIRECTORY } from '@/data/mockWorks'

type WorkState = {
  workItems: WorkItem[]
  teamDirectory: Assignee[]
  searchQuery: string
  priorityFilter: Priority | 'all'
  roleFilter: UserRole | 'all'
  affiliationFilter: UserAffiliation | 'all'
}

const STORAGE_KEY = 'work-assignment-state'

const loadFromStorage = (): Partial<WorkState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Corrupt or inaccessible localStorage — fall back to mock defaults below.
  }
  return {}
}

const initialStoredState = loadFromStorage()

const initialState: WorkState = {
  workItems: initialStoredState.workItems || MOCK_WORK_ITEMS,
  teamDirectory: initialStoredState.teamDirectory || TEAM_DIRECTORY,
  searchQuery: '',
  priorityFilter: 'all',
  roleFilter: 'all',
  affiliationFilter: 'all',
}

const workSlice = createSlice({
  name: 'work',
  initialState,
  reducers: {
    addWorkItem: (state, action: PayloadAction<WorkItem>) => {
      state.workItems.push(action.payload)
    },
    updateWorkItem: (state, action: PayloadAction<{ id: string; updates: Partial<WorkItem> }>) => {
      const index = state.workItems.findIndex(item => item.id === action.payload.id)
      if (index !== -1) {
        state.workItems[index] = { ...state.workItems[index], ...action.payload.updates }
      }
    },
    deleteWorkItem: (state, action: PayloadAction<string>) => {
      state.workItems = state.workItems.filter(item => item.id !== action.payload)
    },
    moveWorkItem: (state, action: PayloadAction<{ id: string; status?: WorkStatus; priority?: Priority }>) => {
      const index = state.workItems.findIndex(item => item.id === action.payload.id)
      if (index !== -1) {
        if (action.payload.status) {
          state.workItems[index].status = action.payload.status
        }
        if (action.payload.priority) {
          state.workItems[index].priority = action.payload.priority
        }
      }
    },
    addTeamMember: (state, action: PayloadAction<Assignee>) => {
      state.teamDirectory.push(action.payload)
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
    setPriorityFilter: (state, action: PayloadAction<Priority | 'all'>) => {
      state.priorityFilter = action.payload
    },
    setRoleFilter: (state, action: PayloadAction<UserRole | 'all'>) => {
      state.roleFilter = action.payload
    },
    setAffiliationFilter: (state, action: PayloadAction<UserAffiliation | 'all'>) => {
      state.affiliationFilter = action.payload
    },
  },
})

export const {
  addWorkItem,
  updateWorkItem,
  deleteWorkItem,
  moveWorkItem,
  addTeamMember,
  setSearchQuery,
  setPriorityFilter,
  setRoleFilter,
  setAffiliationFilter,
} = workSlice.actions

export default workSlice.reducer

// Persist to localStorage on state changes
export const persistWorkState = (state: WorkState) => {
  try {
    const toStore = {
      workItems: state.workItems,
      teamDirectory: state.teamDirectory,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
  } catch {
    // Storage full or unavailable — state simply won't persist across reloads.
  }
}

<script setup lang="ts">
import {ref, watch, onMounted} from 'vue'
import PermissionManager from './components/PermissionManager.vue'
import RoleBuilder from './components/RoleBuilder.vue'
import type {Permission, Role, AppData} from './types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {Button} from '@/components/ui/button'

const STORAGE_KEY = 'role-creator-data'

const permissions = ref<Permission[]>([])
const roles = ref<Role[]>([])
const showClearAllDialog = ref(false)
const showImportSuccessDialog = ref(false)
const showImportErrorDialog = ref(false)
const importMessage = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

// Load data from localStorage on mount
onMounted(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const data: AppData = JSON.parse(saved)
      if (data.permissions && Array.isArray(data.permissions)) {
        permissions.value = data.permissions
      }
      if (data.roles && Array.isArray(data.roles)) {
        roles.value = data.roles
      }
    }
  } catch (error) {
    console.error('Error loading data from localStorage:', error)
  }
})

// Save to localStorage whenever permissions or roles change
watch([permissions, roles], () => {
  try {
    const data: AppData = {
      permissions: permissions.value,
      roles: roles.value
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving data to localStorage:', error)
  }
}, { deep: true })

const addPermission = (permission: Permission) => {
  permissions.value.push(permission)
}

const deletePermission = (id: string) => {
  permissions.value = permissions.value.filter(p => p.id !== id)
  roles.value = roles.value.map(role => ({
    ...role,
    permissions: role.permissions.filter(p => p.id !== id)
  }))
}

const addRole = (role: Role) => {
  roles.value.push(role)
}

const deleteRole = (id: string) => {
  roles.value = roles.value.filter(r => r.id !== id)
}

const updateRole = (updatedRole: Role) => {
  const index = roles.value.findIndex(r => r.id === updatedRole.id)
  if (index !== -1) {
    roles.value[index] = updatedRole
  }
}

const exportData = () => {
  const data: AppData = {
    permissions: permissions.value,
    roles: roles.value
  }
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], {type: 'application/json'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `roles-and-permissions-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const importData = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        let data = JSON.parse(e.target?.result as string)
        console.log('Raw imported data:', data)

        // Handle case where data is an array or object of permissions directly
        if (Array.isArray(data)) {
          data = {
            permissions: data.map((p: any) => ({
              ...p,
              id: String(p.id)
            })),
            roles: []
          }
        } else if (data.permissions === undefined && typeof data === 'object') {
          // Convert object with numeric keys to array
          const permissionsArray = Object.values(data).map((p: any) => ({
            ...p,
            id: String(p.id)
          }))
          data = {
            permissions: permissionsArray,
            roles: []
          }
        }

        // Ensure all IDs are strings
        if (data.permissions && Array.isArray(data.permissions)) {
          permissions.value = data.permissions.map((p: any) => ({
            ...p,
            id: String(p.id)
          }))
          console.log('Permissions loaded:', permissions.value)
        }
        if (data.roles && Array.isArray(data.roles)) {
          roles.value = data.roles.map((r: any) => ({
            ...r,
            id: String(r.id)
          }))
          console.log('Roles loaded:', roles.value)
        }
        importMessage.value = `Data imported successfully! Loaded ${permissions.value.length} permissions and ${roles.value.length} roles.`
        showImportSuccessDialog.value = true
      } catch (error) {
        importMessage.value = 'Error importing data. Please check the file format.'
        showImportErrorDialog.value = true
        console.error(error)
      }
    }
    reader.readAsText(file)
  }
  input.value = ''
}

const confirmClearAll = () => {
  permissions.value = []
  roles.value = []
  localStorage.removeItem(STORAGE_KEY)
  showClearAllDialog.value = false
}

const triggerImport = () => {
  fileInputRef.value?.click()
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <header class="bg-white border-b border-gray-200 px-8 py-12">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">Role Creator</h1>
        <p class="text-xl text-gray-600 mb-8 font-medium">Create and manage permissions and roles visually</p>
        <div class="flex gap-3 flex-wrap">
          <Button @click="triggerImport" variant="outline" class="font-semibold">
            Import Data
          </Button>
          <input
              ref="fileInputRef"
              type="file"
              accept=".json"
              @change="importData"
              class="hidden"
          />
          <Button @click="exportData" variant="outline" class="font-semibold">
            Export Data
          </Button>
          <Button @click="showClearAllDialog = true" variant="destructive" class="font-semibold">
            Clear All
          </Button>
        </div>
      </div>
    </header>

    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 max-w-7xl w-full mx-auto items-start">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <PermissionManager
            :permissions="permissions"
            @add-permission="addPermission"
            @delete-permission="deletePermission"
        />
      </div>
      <div class="lg:sticky lg:top-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-h-[calc(100vh-6rem)] overflow-y-auto">
        <RoleBuilder
            :roles="roles"
            @add-role="addRole"
            @delete-role="deleteRole"
            @update-role="updateRole"
        />
      </div>
    </div>

    <footer class="bg-white border-t border-gray-200 px-8 py-6 mt-auto">
      <div class="max-w-7xl mx-auto">
        <p class="text-sm text-gray-600 font-medium">
          <span class="font-semibold text-gray-900">How it works:</span> Drag permissions from the left panel into roles on the right. Use Import/Export to save and load your configurations.
        </p>
      </div>
    </footer>

    <!-- Clear All Confirmation Dialog -->
    <AlertDialog v-model:open="showClearAllDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all permissions and roles. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction @click="confirmClearAll">
            Clear All
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Import Success Dialog -->
    <AlertDialog v-model:open="showImportSuccessDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Import Successful</AlertDialogTitle>
          <AlertDialogDescription>
            {{ importMessage }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Import Error Dialog -->
    <AlertDialog v-model:open="showImportErrorDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Import Failed</AlertDialogTitle>
          <AlertDialogDescription>
            {{ importMessage }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>


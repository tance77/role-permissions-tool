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
  <div class="min-h-screen flex flex-col bg-background">
    <header class="bg-card border-b border-border px-6 py-6">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-2xl font-bold text-foreground mb-0.5 tracking-tight">Role Creator</h1>
        <p class="text-xs text-muted-foreground mb-4">Create and manage permissions and roles visually</p>
        <div class="flex gap-2 flex-wrap">
          <Button @click="triggerImport" variant="outline" size="sm">
            Import Data
          </Button>
          <input
              ref="fileInputRef"
              type="file"
              accept=".json"
              @change="importData"
              class="hidden"
          />
          <Button @click="exportData" variant="outline" size="sm">
            Export Data
          </Button>
          <Button @click="showClearAllDialog = true" variant="destructive" size="sm">
            Clear All
          </Button>
        </div>
      </div>
    </header>

    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 p-5 max-w-7xl w-full mx-auto items-start">
      <div class="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <PermissionManager
            :permissions="permissions"
            @add-permission="addPermission"
            @delete-permission="deletePermission"
        />
      </div>
      <div class="lg:sticky lg:top-6 bg-card rounded-lg shadow-sm border border-border overflow-hidden max-h-[calc(100vh-5rem)] overflow-y-auto">
        <RoleBuilder
            :roles="roles"
            @add-role="addRole"
            @delete-role="deleteRole"
            @update-role="updateRole"
        />
      </div>
    </div>

    <footer class="bg-card border-t border-border px-6 py-3 mt-auto">
      <div class="max-w-7xl mx-auto">
        <p class="text-xs text-muted-foreground leading-relaxed">
          Drag permissions into roles • Import/Export to save configurations
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


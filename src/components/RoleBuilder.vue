<script setup lang="ts">
import { ref } from 'vue'
import type { Role, Permission } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, ChevronDown, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  roles: Role[]
}>()

const emit = defineEmits<{
  addRole: [role: Role]
  deleteRole: [id: string]
  updateRole: [role: Role]
}>()

const newRole = ref({
  name: '',
  description: ''
})

const showAddForm = ref(false)
const expandedRoles = ref<Set<string>>(new Set())

const addRole = () => {
  if (newRole.value.name.trim()) {
    const role: Role = {
      id: crypto.randomUUID(),
      name: newRole.value.name.trim(),
      description: newRole.value.description.trim(),
      permissions: []
    }
    emit('addRole', role)
    expandedRoles.value.add(role.id)
    newRole.value = { name: '', description: '' }
    showAddForm.value = false
  }
}

const deleteRole = (id: string) => {
  emit('deleteRole', id)
  expandedRoles.value.delete(id)
}

const toggleRole = (id: string) => {
  if (expandedRoles.value.has(id)) {
    expandedRoles.value.delete(id)
  } else {
    expandedRoles.value.add(id)
  }
}

const handleDrop = (event: DragEvent, role: Role) => {
  event.preventDefault()

  // Check for multiple permissions first
  const permissionsData = event.dataTransfer?.getData('permissions')
  if (permissionsData) {
    const permissions: Permission[] = JSON.parse(permissionsData)

    // Add all permissions that aren't already in the role
    const newPermissions = permissions.filter(
      permission => !role.permissions.find(p => p.id === permission.id)
    )

    if (newPermissions.length > 0) {
      const updatedRole = {
        ...role,
        permissions: [...role.permissions, ...newPermissions]
      }
      emit('updateRole', updatedRole)
    }
    return
  }

  // Fall back to single permission
  const permissionData = event.dataTransfer?.getData('permission')
  if (permissionData) {
    const permission: Permission = JSON.parse(permissionData)

    if (!role.permissions.find(p => p.id === permission.id)) {
      const updatedRole = {
        ...role,
        permissions: [...role.permissions, permission]
      }
      emit('updateRole', updatedRole)
    }
  }
}

const removePermissionFromRole = (role: Role, permissionId: string) => {
  const updatedRole = {
    ...role,
    permissions: role.permissions.filter(p => p.id !== permissionId)
  }
  emit('updateRole', updatedRole)
}

const allowDrop = (event: DragEvent) => {
  event.preventDefault()
}
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-3xl font-bold text-gray-900">Roles</h2>
      <Button v-if="roles.length > 0" @click="showAddForm = !showAddForm" class="font-semibold">
        {{ showAddForm ? 'Cancel' : '+ New Role' }}
      </Button>
    </div>

    <Card v-if="showAddForm" class="mb-8 border-gray-200">
      <CardHeader class="pb-4">
        <CardTitle class="text-lg font-bold text-gray-900">Create New Role</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex flex-col gap-4">
          <div>
            <Input
              v-model="newRole.name"
              type="text"
              placeholder="Role Name *"
              @keyup.enter="addRole"
              class="text-base"
            />
          </div>
          <div>
            <Input
              v-model="newRole.description"
              type="text"
              placeholder="Description"
              @keyup.enter="addRole"
              class="text-base"
            />
          </div>
          <Button @click="addRole" class="font-semibold w-full">
            Create Role
          </Button>
        </div>
      </CardContent>
    </Card>

    <div>
      <div v-if="roles.length === 0 && !showAddForm" class="p-16 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div class="flex flex-col items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-1">No roles yet</h3>
            <p class="text-sm text-gray-600 mb-4">Create a role to start bundling permissions together</p>
          </div>
          <Button @click="showAddForm = true" class="font-semibold">
            + Create Your First Role
          </Button>
        </div>
      </div>
      <div v-else class="flex flex-col gap-5">
        <Card
          v-for="role in roles"
          :key="role.id"
          :class="[
            'overflow-hidden transition-all border-2',
            expandedRoles.has(role.id) ? 'border-purple-500 shadow-md' : 'border-gray-200'
          ]"
        >
          <CardHeader class="cursor-pointer select-none hover:bg-gray-50 p-5" @click="toggleRole(role.id)">
            <div class="flex justify-between items-center">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2 flex-wrap">
                  <CardTitle class="text-xl font-bold text-gray-900">{{ role.name }}</CardTitle>
                  <Badge variant="default">{{ role.permissions.length }} permissions</Badge>
                </div>
                <p v-if="role.description" class="text-gray-600 text-sm m-0 font-medium">
                  {{ role.description }}
                </p>
              </div>
              <div class="flex items-center gap-3">
                <button
                  @click.stop="deleteRole(role.id)"
                  class="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors text-lg"
                  title="Delete role"
                >
                  ×
                </button>
                <ChevronDown v-if="expandedRoles.has(role.id)" class="size-4 text-gray-400"/>
                <ChevronRight v-else class="size-4 text-gray-400"/>
              </div>
            </div>
          </CardHeader>

          <CardContent v-if="expandedRoles.has(role.id)" class="border-t border-gray-200 p-0">
            <div
              class="p-5 min-h-[120px] bg-gray-50 hover:bg-purple-50 transition-colors"
              @drop="(e) => handleDrop(e, role)"
              @dragover="allowDrop"
            >
              <div v-if="role.permissions.length === 0" class="p-10 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                <p class="text-base font-medium">Drag permissions here to add them to this role</p>
              </div>
              <div v-else class="bg-white">
                <div
                  v-for="permission in role.permissions"
                  :key="permission.id"
                  class="flex items-center justify-between gap-4 px-4 py-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors group"
                >
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <strong class="text-sm font-semibold text-gray-900">{{ permission.name }}</strong>
                        <Badge v-if="permission.category" variant="secondary">{{ permission.category }}</Badge>
                      </div>
                      <p v-if="permission.description" class="text-xs text-gray-600 mt-1 mb-0">
                        {{ permission.description }}
                      </p>
                    </div>
                  </div>
                  <button
                    @click="removePermissionFromRole(role, permission.id)"
                    class="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove permission"
                  >
                    <X class="size-4"/>
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>


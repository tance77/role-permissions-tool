<script setup lang="ts">
import { ref } from 'vue'
import type { Role, Permission } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, ChevronDown, ChevronRight } from 'lucide-vue-next'

defineProps<{
  roles: Role[]
}>()

const emit = defineEmits<{
  addRole: [role: Role]
  deleteRole: [id: string]
  updateRole: [role: Role]
}>()

const groupPermissionsByCategory = (permissions: Permission[]) => {
  const groups: Record<string, Permission[]> = {}

  permissions.forEach(permission => {
    const category = permission.category || 'Uncategorized'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(permission)
  })

  return Object.keys(groups)
    .sort()
    .reduce((acc, key) => {
      acc[key] = groups[key].sort((a, b) => a.name.localeCompare(b.name))
      return acc
    }, {} as Record<string, Permission[]>)
}

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
  <div class="p-4">
    <div v-if="showAddForm" class="mb-4 pb-4 border-b border-border">
      <div class="flex justify-between items-center mb-3">
        <h2 class="text-sm font-semibold text-foreground">Add Role</h2>
        <Button @click="showAddForm = false" variant="ghost" size="sm" class="h-7 text-xs">Cancel</Button>
      </div>
      <div class="flex flex-col gap-2">
        <Input
          v-model="newRole.name"
          type="text"
          placeholder="Role name *"
          @keyup.enter="addRole"
          class="h-8 text-sm"
        />
        <Input
          v-model="newRole.description"
          type="text"
          placeholder="Description"
          @keyup.enter="addRole"
          class="h-8 text-sm"
        />
        <Button @click="addRole" size="sm" class="w-full h-8">
          Create Role
        </Button>
      </div>
    </div>

    <div v-else class="flex justify-between items-center mb-4 pb-4 border-b border-border">
      <div>
        <h2 class="text-xs font-semibold text-foreground uppercase tracking-wide">Roles</h2>
        <p class="text-xs text-muted-foreground">{{ roles.length }} total</p>
      </div>
      <Button v-if="roles.length > 0" @click="showAddForm = true" size="sm" class="h-7 text-xs">
        + New Role
      </Button>
    </div>

    <div>
      <div v-if="roles.length === 0 && !showAddForm" class="p-8 text-center bg-muted rounded border border-dashed border-border">
        <div class="flex flex-col items-center gap-2">
          <div class="w-10 h-10 rounded-full bg-muted-foreground/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <p class="text-xs text-muted-foreground mb-2">No roles yet</p>
          <Button @click="showAddForm = true" size="sm" class="h-7 text-xs">
            + Create Role
          </Button>
        </div>
      </div>
      <div v-else class="flex flex-col gap-2">
        <Card
          v-for="role in roles"
          :key="role.id"
          :class="[
            'overflow-hidden transition-all border rounded-sm',
            expandedRoles.has(role.id) ? 'border-primary' : 'border-border'
          ]"
        >
          <CardHeader class="cursor-pointer select-none hover:bg-accent p-3" @click="toggleRole(role.id)">
            <div class="flex justify-between items-center">
              <div class="flex-1">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <CardTitle class="text-sm font-bold text-foreground">{{ role.name }}</CardTitle>
                  <Badge variant="secondary" class="h-4 px-1.5 text-xs">{{ role.permissions.length }}</Badge>
                </div>
                <p v-if="role.description" class="text-xs text-muted-foreground m-0 mt-0.5">
                  {{ role.description }}
                </p>
              </div>
              <div class="flex items-center gap-1.5">
                <button
                  @click.stop="deleteRole(role.id)"
                  class="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Delete role"
                >
                  <X class="size-3"/>
                </button>
                <ChevronDown v-if="expandedRoles.has(role.id)" class="size-3.5 text-muted-foreground"/>
                <ChevronRight v-else class="size-3.5 text-muted-foreground"/>
              </div>
            </div>
          </CardHeader>

          <CardContent v-if="expandedRoles.has(role.id)" class="border-t border-border p-0">
            <div
              class="p-3 min-h-[80px] bg-muted hover:bg-accent transition-colors"
              @drop="(e) => handleDrop(e, role)"
              @dragover="allowDrop"
            >
              <div v-if="role.permissions.length === 0" class="p-6 text-center text-muted-foreground border border-dashed border-border rounded bg-card">
                <p class="text-xs">Drag permissions here</p>
              </div>
              <div v-else class="bg-card rounded border border-border">
                <div
                  v-for="(groupPermissions, category) in groupPermissionsByCategory(role.permissions)"
                  :key="category"
                >
                  <div class="px-2 py-1 bg-muted border-b border-border flex items-center gap-1">
                    <h5 class="text-xs font-bold text-foreground uppercase tracking-wide">{{ category }}</h5>
                    <Badge variant="outline" class="h-4 px-1.5 text-xs">{{ groupPermissions.length }}</Badge>
                  </div>
                  <div
                    v-for="permission in groupPermissions"
                    :key="permission.id"
                    class="flex items-center justify-between gap-2 px-2 py-1.5 border-b border-border/50 last:border-b-0 hover:bg-accent transition-colors group"
                  >
                    <div class="flex-1 min-w-0">
                      <strong class="text-xs font-semibold text-foreground">{{ permission.name }}</strong>
                      <p v-if="permission.description" class="text-xs text-muted-foreground mt-0.5 mb-0 leading-snug">
                        {{ permission.description }}
                      </p>
                    </div>
                    <button
                      @click="removePermissionFromRole(role, permission.id)"
                      class="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove permission"
                    >
                      <X class="size-3"/>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>


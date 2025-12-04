<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Permission } from '../types'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-vue-next'


const props = defineProps<{
  permissions: Permission[]
}>()

const emit = defineEmits<{
  addPermission: [permission: Permission]
  deletePermission: [id: string]
}>()

const newPermission = ref({
  name: '',
  description: ''
})

const groupBy = ref<'action' | 'category'>('category')
const showAddForm = ref(false)
const selectedPermissions = ref<Set<string>>(new Set())

// Group permissions by action (edit, view, delete, etc.)
const permissionsByAction = computed(() => {
  const groups: Record<string, Permission[]> = {}

  props.permissions.forEach(permission => {
    // Extract action from permission name (e.g., "users.edit" -> "edit")
    const parts = permission.name.split('.')
    const action = parts[parts.length - 1] || 'unknown'

    if (!groups[action]) {
      groups[action] = []
    }
    groups[action].push(permission)
  })

  // Sort groups by action name
  return Object.keys(groups)
    .sort()
    .reduce((acc, key) => {
      const group = groups[key]
      if (group) {
        acc[key] = group.sort((a, b) => a.name.localeCompare(b.name))
      }
      return acc
    }, {} as Record<string, Permission[]>)
})

// Group permissions by category
const permissionsByCategory = computed(() => {
  const groups: Record<string, Permission[]> = {}

  props.permissions.forEach(permission => {
    // Extract category from permission name (e.g., "users.view" -> "users")
    const parts = permission.name.split('.')
    const category = parts.length > 1 ? parts[0] : 'Uncategorized'

    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(permission)
  })

  // Sort groups by category name
  return Object.keys(groups)
    .sort()
    .reduce((acc, key) => {
      const group = groups[key]
      if (group) {
        acc[key] = group.sort((a, b) => a.name.localeCompare(b.name))
      }
      return acc
    }, {} as Record<string, Permission[]>)
})

const groupedPermissions = computed(() => {
  return groupBy.value === 'action' ? permissionsByAction.value : permissionsByCategory.value
})

const addPermission = () => {
  if (newPermission.value.name.trim()) {
    const permission: Permission = {
      id: crypto.randomUUID(),
      name: newPermission.value.name.trim(),
      description: newPermission.value.description.trim()
    }
    emit('addPermission', permission)
    newPermission.value = { name: '', description: '' }
    showAddForm.value = false
  }
}

const deletePermission = (id: string) => {
  emit('deletePermission', id)
}

const togglePermission = (id: string) => {
  const newSet = new Set(selectedPermissions.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  selectedPermissions.value = newSet
}

const toggleGroup = (group: Permission[]) => {
  const allSelected = group.every(p => selectedPermissions.value.has(p.id))
  const newSet = new Set(selectedPermissions.value)

  if (allSelected) {
    // Deselect all in group
    group.forEach(p => newSet.delete(p.id))
  } else {
    // Select all in group
    group.forEach(p => newSet.add(p.id))
  }
  selectedPermissions.value = newSet
}

const isGroupSelected = (group: Permission[]) => {
  return group.length > 0 && group.every(p => selectedPermissions.value.has(p.id))
}

const clearSelection = () => {
  selectedPermissions.value = new Set()
}

const onDragStart = (e: DragEvent, permission: Permission) => {
  if (selectedPermissions.value.has(permission.id)) {
    // Dragging multiple selected permissions
    const selected = props.permissions.filter(p => selectedPermissions.value.has(p.id))
    e.dataTransfer?.setData('permissions', JSON.stringify(selected))
  } else {
    // Dragging single permission
    e.dataTransfer?.setData('permission', JSON.stringify(permission))
  }
}
</script>

<template>
  <div class="p-4">
    <div v-if="showAddForm" class="mb-4 pb-4 border-b border-border">
      <div class="flex justify-between items-center mb-3">
        <h2 class="text-sm font-semibold text-foreground">Add Permission</h2>
        <Button @click="showAddForm = false" variant="ghost" size="sm" class="h-7 text-xs">Cancel</Button>
      </div>
      <div class="flex flex-col gap-2">
        <Input
          v-model="newPermission.name"
          type="text"
          placeholder="Permission name *"
          @keyup.enter="addPermission"
          class="h-8 text-sm"
        />
        <Input
          v-model="newPermission.description"
          type="text"
          placeholder="Description"
          @keyup.enter="addPermission"
          class="h-8 text-sm"
        />
        <Button @click="addPermission" size="sm" class="w-full h-8">
          Add Permission
        </Button>
      </div>
    </div>

    <div v-else class="flex justify-between items-center mb-4 pb-4 border-b border-border">
      <div>
        <h2 class="text-xs font-semibold text-foreground uppercase tracking-wide">Permissions</h2>
        <p class="text-xs text-muted-foreground">{{ permissions.length }} total</p>
      </div>
      <Button v-if="permissions.length > 0" @click="showAddForm = true" size="sm" class="h-7 text-xs">
        + New Permission
      </Button>
    </div>

    <div>
      <div v-if="selectedPermissions.size > 0" class="flex justify-end mb-3">
        <Button
          @click="clearSelection"
          variant="secondary"
          size="sm"
        >
          Clear ({{ selectedPermissions.size }})
        </Button>
      </div>

      <div v-if="permissions.length === 0 && !showAddForm" class="p-8 text-center bg-muted rounded border border-dashed border-border">
        <div class="flex flex-col items-center gap-2">
          <div class="w-10 h-10 rounded-full bg-muted-foreground/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <p class="text-xs text-muted-foreground mb-2">No permissions yet</p>
          <Button @click="showAddForm = true" size="sm" class="h-7 text-xs">
            + Add Permission
          </Button>
        </div>
      </div>

      <Tabs v-if="permissions.length > 0" default-value="category" class="w-full" @update:model-value="(value) => groupBy = value as 'action' | 'category'">
        <TabsList class="mb-3">
          <TabsTrigger value="action" class="text-xs">By Action</TabsTrigger>
          <TabsTrigger value="category" class="text-xs">By Category</TabsTrigger>
        </TabsList>

        <div class="flex flex-col gap-4">
        <div
          v-for="(group, groupName) in groupedPermissions"
          :key="groupName"
          class="border-l-2 border-primary/30 pl-3"
        >
          <div class="flex justify-between items-center mb-2 gap-3">
            <div class="flex items-center gap-1.5">
              <h4 class="text-xs font-bold text-foreground capitalize">
                {{ groupName }}
              </h4>
              <Badge variant="secondary" class="h-4 px-1.5 text-xs">{{ group.length }}</Badge>
            </div>
            <Button
              @click="toggleGroup(group)"
              size="sm"
              :variant="isGroupSelected(group) ? 'default' : 'outline'"
              class="h-7 text-xs"
            >
              {{ isGroupSelected(group) ? 'Deselect' : 'Select All' }}
            </Button>
          </div>
          <div class="grid grid-cols-1 gap-1.5">
            <Card
              v-for="permission in group"
              :key="permission.id"
              :class="[
                'cursor-pointer transition-all border rounded-sm',
                selectedPermissions.has(permission.id)
                  ? 'border-primary/30 bg-accent'
                  : 'border-border hover:border-muted-foreground/50 hover:bg-accent'
              ]"
              draggable="true"
              @dragstart="(e: DragEvent) => onDragStart(e, permission)"
              @click="togglePermission(permission.id)"
            >
              <CardContent class="p-2">
                <div class="flex gap-2 items-start">
                  <div class="flex-shrink-0 pt-0.5 pointer-events-none">
                    <Checkbox
                      :id="`permission-${permission.id}`"
                      :model-value="selectedPermissions.has(permission.id)"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <strong class="text-xs font-semibold text-foreground">{{ permission.name }}</strong>
                    <p v-if="permission.description" class="text-xs text-muted-foreground m-0 mt-0.5 leading-snug">
                      {{ permission.description }}
                    </p>
                  </div>
                  <button
                    @click.stop="deletePermission(permission.id)"
                    class="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete permission"
                  >
                    <X class="size-3"/>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </Tabs>
    </div>
  </div>
</template>


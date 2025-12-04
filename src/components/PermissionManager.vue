<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Permission } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

const props = defineProps<{
  permissions: Permission[]
}>()

const emit = defineEmits<{
  addPermission: [permission: Permission]
  deletePermission: [id: string]
}>()

const newPermission = ref({
  name: '',
  description: '',
  category: ''
})

const groupBy = ref<'action' | 'category'>('category')
const selectedPermissions = ref<Set<string>>(new Set())

// Group permissions by action (edit, view, delete, etc.)
const permissionsByAction = computed(() => {
  const groups: Record<string, Permission[]> = {}

  props.permissions.forEach(permission => {
    // Extract action from permission name (e.g., "users.edit" -> "edit")
    const parts = permission.name.split('.')
    const action = parts[parts.length - 1]

    if (!groups[action]) {
      groups[action] = []
    }
    groups[action].push(permission)
  })

  // Sort groups by action name
  return Object.keys(groups)
    .sort()
    .reduce((acc, key) => {
      acc[key] = groups[key].sort((a, b) => a.name.localeCompare(b.name))
      return acc
    }, {} as Record<string, Permission[]>)
})

// Group permissions by category
const permissionsByCategory = computed(() => {
  const groups: Record<string, Permission[]> = {}

  props.permissions.forEach(permission => {
    const category = permission.category || 'Uncategorized'

    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(permission)
  })

  // Sort groups by category name
  return Object.keys(groups)
    .sort()
    .reduce((acc, key) => {
      acc[key] = groups[key].sort((a, b) => a.name.localeCompare(b.name))
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
      description: newPermission.value.description.trim(),
      category: newPermission.value.category.trim() || undefined
    }
    emit('addPermission', permission)
    newPermission.value = { name: '', description: '', category: '' }
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

const isGroupPartiallySelected = (group: Permission[]) => {
  const selectedCount = group.filter(p => selectedPermissions.value.has(p.id)).length
  return selectedCount > 0 && selectedCount < group.length
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
  <div class="p-6">
    <h2 class="text-3xl font-bold mb-6 text-gray-900">Permissions</h2>

    <Card class="mb-8 border-gray-200">
      <CardHeader class="pb-4">
        <CardTitle class="text-lg font-bold text-gray-900">Add New Permission</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex flex-col gap-4">
          <div>
            <Input
              v-model="newPermission.name"
              type="text"
              placeholder="Permission Name *"
              @keyup.enter="addPermission"
              class="text-base"
            />
          </div>
          <div>
            <Input
              v-model="newPermission.description"
              type="text"
              placeholder="Description"
              @keyup.enter="addPermission"
              class="text-base"
            />
          </div>
          <div>
            <Input
              v-model="newPermission.category"
              type="text"
              placeholder="Category (optional)"
              @keyup.enter="addPermission"
              class="text-base"
            />
          </div>
          <Button @click="addPermission" class="font-semibold w-full">
            Add Permission
          </Button>
        </div>
      </CardContent>
    </Card>

    <div>
      <div class="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div>
          <h3 class="text-xl font-bold text-gray-900">Available Permissions</h3>
          <p class="text-sm text-gray-600 mt-1">{{ permissions.length }} total</p>
        </div>
        <Button
          v-if="selectedPermissions.size > 0"
          @click="clearSelection"
          variant="secondary"
          size="sm"
          class="font-semibold"
        >
          Clear ({{ selectedPermissions.size }})
        </Button>
      </div>

      <div v-if="permissions.length === 0" class="p-12 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p class="text-base font-medium">No permissions yet. Add some above!</p>
      </div>

      <Tabs v-else default-value="category" class="w-full" @update:model-value="(value) => groupBy = value as 'action' | 'category'">
        <TabsList class="mb-8">
          <TabsTrigger value="action" class="font-semibold">By Action</TabsTrigger>
          <TabsTrigger value="category" class="font-semibold">By Category</TabsTrigger>
        </TabsList>

        <div class="flex flex-col gap-10">
        <div
          v-for="(group, groupName) in groupedPermissions"
          :key="groupName"
          class="border-l-4 border-blue-500 pl-6"
        >
          <div class="flex justify-between items-center mb-5 gap-4 flex-wrap">
            <div>
              <h4 class="text-lg font-bold text-gray-900 capitalize flex items-center gap-3">
                {{ groupName }}
                <Badge variant="default">{{ group.length }}</Badge>
              </h4>
            </div>
            <Button
              @click="toggleGroup(group)"
              size="sm"
              :variant="isGroupSelected(group) ? 'default' : 'outline'"
              class="font-semibold"
            >
              {{ isGroupSelected(group) ? 'Deselect All' : 'Select All' }}
            </Button>
          </div>
          <div class="grid grid-cols-1 gap-3">
            <Card
              v-for="permission in group"
              :key="permission.id"
              :class="[
                'cursor-pointer transition-all border-2',
                selectedPermissions.has(permission.id)
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
              ]"
              draggable="true"
              @dragstart="(e) => onDragStart(e, permission)"
              @click="togglePermission(permission.id)"
            >
              <CardContent class="p-4">
                <div class="flex gap-4 items-start">
                  <div class="flex-shrink-0 pt-0.5 pointer-events-none">
                    <Checkbox
                      :id="`permission-${permission.id}`"
                      :model-value="selectedPermissions.has(permission.id)"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex flex-col gap-2">
                      <div class="flex items-center gap-3 flex-wrap">
                        <strong class="text-base font-bold text-gray-900">{{ permission.name }}</strong>
                        <Badge v-if="permission.category" variant="secondary">{{ permission.category }}</Badge>
                      </div>
                      <p v-if="permission.description" class="text-sm text-gray-600 m-0 leading-relaxed">
                        {{ permission.description }}
                      </p>
                    </div>
                  </div>
                  <button
                    @click.stop="deletePermission(permission.id)"
                    class="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors text-lg"
                    title="Delete permission"
                  >
                    ×
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


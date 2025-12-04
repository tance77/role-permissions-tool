export interface Permission {
  id: string
  name: string
  description: string
  category?: string
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
}

export interface AppData {
  permissions: Permission[]
  roles: Role[]
}

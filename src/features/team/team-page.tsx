import { useState } from 'react'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  Mail,
  Shield,
  MoreHorizontal,
  RefreshCw,
  UserCog,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { PermissionGate } from '@/components/permission-gate'
import { usePermissions } from '@/hooks'
import { useAppSelector } from '@/app/store'
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  type ApiUser,
  type ApiUserRole,
  type UserCreateRequest,
  type UserUpdateRequest,
} from '@/lib/api'
import { UserForm } from './user-form'

type TeamRole = ApiUserRole

const roleLabels: Record<TeamRole, string> = {
  admin: 'Super Admin',
  tenant_admin: 'Admin',
  scheduler: 'Scheduler',
  mechanic: 'Mechanic',
  auditor: 'Auditor',
}

const roleColors: Record<TeamRole, string> = {
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  tenant_admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  scheduler: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  mechanic: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  auditor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
}

// Display member type for UI
interface DisplayMember {
  id: string
  email: string
  firstName: string
  lastName: string
  role: TeamRole
  lastLogin: string | null
  createdAt: string
  updatedAt: string
  originalUser: ApiUser // Keep reference to original API user for editing
}

// Convert API user to display member
function toDisplayMember(user: ApiUser): DisplayMember {
  // Extract first/last name from email (before @) or use email as name
  const emailName = user.email.split('@')[0]
  const nameParts = emailName.split(/[._-]/)
  const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : ''
  const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : ''

  return {
    id: user.id,
    email: user.email,
    firstName: firstName || emailName,
    lastName: lastName || '',
    role: user.role,
    lastLogin: user.last_login,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    originalUser: user,
  }
}

export function TeamPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [selectedMember, setSelectedMember] = useState<DisplayMember | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null)

  const { can } = usePermissions()
  const canManageTeam = can('manage:team')

  const { orgId, isAuthenticated } = useAppSelector((state) => state.auth)
  const isDemo = !isAuthenticated || !orgId

  // RTK Query hooks
  const { data: apiUsers, isLoading, refetch, isFetching } = useGetUsersQuery(
    { role: roleFilter === 'all' ? undefined : roleFilter },
    { skip: isDemo }
  )

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation()
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation()

  // Convert API data to display format
  const teamMembers: DisplayMember[] = apiUsers
    ? apiUsers.map(toDisplayMember)
    : []

  const filteredMembers = teamMembers.filter((member) => {
    const matchesRole = roleFilter === 'all' || member.role === roleFilter
    const matchesSearch =
      member.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesRole && matchesSearch
  })

  const stats = {
    total: teamMembers.length,
    admins: teamMembers.filter((m) => m.role === 'tenant_admin' || m.role === 'admin').length,
    mechanics: teamMembers.filter((m) => m.role === 'mechanic').length,
    schedulers: teamMembers.filter((m) => m.role === 'scheduler').length,
    auditors: teamMembers.filter((m) => m.role === 'auditor').length,
  }

  // Handlers
  const handleAddClick = () => {
    setEditingUser(null)
    setFormOpen(true)
  }

  const handleEditClick = (member: DisplayMember, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingUser(member.originalUser)
    setFormOpen(true)
  }

  const handleFormSubmit = async (data: UserCreateRequest | UserUpdateRequest) => {
    try {
      if (editingUser) {
        // Update existing user
        await updateUser({
          id: editingUser.id,
          data: data as UserUpdateRequest,
        }).unwrap()
        toast.success('Team member updated successfully')
      } else {
        // Create new user
        await createUser(data as UserCreateRequest).unwrap()
        toast.success('Team member added successfully')
      }
      setFormOpen(false)
      setEditingUser(null)
    } catch (error: unknown) {
      const err = error as { data?: { error?: string } }
      const message = err?.data?.error || 'An error occurred'
      toast.error(editingUser ? `Failed to update: ${message}` : `Failed to add: ${message}`)
    }
  }

  const handleDelete = async () => {
    if (!editingUser) return

    try {
      await deleteUser({ id: editingUser.id }).unwrap()
      toast.success('Team member deleted successfully')
      setFormOpen(false)
      setEditingUser(null)
    } catch (error: unknown) {
      const err = error as { data?: { error?: string } }
      const message = err?.data?.error || 'An error occurred'
      toast.error(`Failed to delete: ${message}`)
    }
  }

  const handleDeleteFromDropdown = async (member: DisplayMember, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingUser(member.originalUser)
    // Open form which has delete confirmation
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage team members and assignments
            {isDemo && <span className="ml-2 text-xs text-amber-600">(Demo Data)</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isDemo || isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <PermissionGate permission="manage:team">
            <Button onClick={handleAddClick} disabled={isDemo}>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Members</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.total}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mechanics</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.mechanics}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Schedulers</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.schedulers}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Auditors</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.auditors}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Shield className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Super Admin</SelectItem>
            <SelectItem value="tenant_admin">Admin</SelectItem>
            <SelectItem value="scheduler">Scheduler</SelectItem>
            <SelectItem value="mechanic">Mechanic</SelectItem>
            <SelectItem value="auditor">Auditor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team Members Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredMembers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            {isDemo ? (
              <div className="space-y-2">
                <p>Demo mode - Connect to API to manage team members</p>
                <p className="text-sm">Login with a real account to access this feature</p>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="space-y-2">
                <p>No team members yet</p>
                {canManageTeam && (
                  <Button onClick={handleAddClick} variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add your first team member
                  </Button>
                )}
              </div>
            ) : (
              'No team members match your search'
            )}
          </div>
        ) : (
          filteredMembers.map((member) => (
            <Card
              key={member.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedMember(member)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold">
                    {member.firstName[0]}{member.lastName ? member.lastName[0] : ''}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold truncate">
                        {member.firstName} {member.lastName}
                      </h3>
                      {canManageTeam && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => handleEditClick(member, e)}>
                              <UserCog className="mr-2 h-4 w-4" />
                              Edit Member
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => handleDeleteFromDropdown(member, e)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {member.email}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={roleColors[member.role]}>
                        {roleLabels[member.role]}
                      </Badge>
                    </div>
                    {member.lastLogin && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Last login: {new Date(member.lastLogin).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Member Detail Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-md">
          {selectedMember && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-semibold">
                    {selectedMember.firstName[0]}{selectedMember.lastName ? selectedMember.lastName[0] : ''}
                  </div>
                  <div>
                    <DialogTitle>
                      {selectedMember.firstName} {selectedMember.lastName}
                    </DialogTitle>
                    <DialogDescription>
                      <Badge className={roleColors[selectedMember.role]}>
                        {roleLabels[selectedMember.role]}
                      </Badge>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${selectedMember.email}`} className="text-primary hover:underline">
                    {selectedMember.email}
                  </a>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Joined</span>
                    <p className="font-medium">{new Date(selectedMember.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Login</span>
                    <p className="font-medium">
                      {selectedMember.lastLogin
                        ? new Date(selectedMember.lastLogin).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                </div>

                {canManageTeam && (
                  <>
                    <Separator />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setEditingUser(selectedMember.originalUser)
                          setSelectedMember(null)
                          setFormOpen(true)
                        }}
                      >
                        <UserCog className="mr-2 h-4 w-4" />
                        Edit Member
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* User Form Dialog (Create/Edit) */}
      <UserForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingUser(null)
        }}
        user={editingUser}
        onSubmit={handleFormSubmit}
        onDelete={editingUser ? handleDelete : undefined}
        isLoading={isCreating || isUpdating}
        isDeleting={isDeleting}
      />
    </div>
  )
}

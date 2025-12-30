import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2 } from 'lucide-react'
import type { ApiUser, ApiUserRole, UserCreateRequest, UserUpdateRequest } from '@/lib/api'

// Validation schema for creating a user
const createUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['admin', 'tenant_admin', 'scheduler', 'mechanic', 'auditor'] as const),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// Validation schema for updating a user
const updateUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
  role: z.enum(['admin', 'tenant_admin', 'scheduler', 'mechanic', 'auditor'] as const),
}).refine((data) => {
  // Only validate password match if password is provided
  if (data.password && data.password.length > 0) {
    return data.password === data.confirmPassword
  }
  return true
}, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type CreateFormValues = z.infer<typeof createUserSchema>
type UpdateFormValues = z.infer<typeof updateUserSchema>
type FormValues = CreateFormValues | UpdateFormValues

const roleOptions: { value: ApiUserRole; label: string; description: string }[] = [
  {
    value: 'tenant_admin',
    label: 'Organization Admin',
    description: 'Full access within the organization',
  },
  {
    value: 'scheduler',
    label: 'Scheduler',
    description: 'Manage maintenance schedules and assign tasks',
  },
  {
    value: 'mechanic',
    label: 'Mechanic',
    description: 'View and complete assigned maintenance tasks',
  },
  {
    value: 'auditor',
    label: 'Auditor',
    description: 'View-only access for compliance auditing',
  },
]

interface UserFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: ApiUser | null // null = create mode, ApiUser = edit mode
  onSubmit: (data: UserCreateRequest | UserUpdateRequest) => Promise<void>
  onDelete?: () => Promise<void>
  isLoading?: boolean
  isDeleting?: boolean
}

export function UserForm({
  open,
  onOpenChange,
  user,
  onSubmit,
  onDelete,
  isLoading = false,
  isDeleting = false,
}: UserFormProps) {
  const isEditing = !!user

  const form = useForm<FormValues>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      role: 'mechanic' as ApiUserRole,
    },
  })

  // Reset form when user changes or dialog opens
  useEffect(() => {
    if (open) {
      if (user) {
        form.reset({
          email: user.email,
          password: '',
          confirmPassword: '',
          role: user.role,
        })
      } else {
        form.reset({
          email: '',
          password: '',
          confirmPassword: '',
          role: 'mechanic',
        })
      }
    }
  }, [user, open, form])

  const handleSubmit = async (values: FormValues) => {
    if (isEditing) {
      // For update, only include password if provided
      const updateData: UserUpdateRequest = {
        email: values.email,
        role: values.role,
      }
      if (values.password && values.password.length > 0) {
        updateData.password = values.password
      }
      await onSubmit(updateData)
    } else {
      // For create, password is required (validated by schema)
      const createData: UserCreateRequest = {
        email: values.email,
        password: values.password!, // Non-null assertion - validated by createUserSchema
        role: values.role,
      }
      await onSubmit(createData)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Team Member' : 'Add Team Member'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the team member\'s information. Leave password blank to keep unchanged.'
              : 'Add a new team member to your organization.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role Field */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span>{option.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This determines what the user can access in the system.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEditing ? 'New Password (optional)' : 'Password'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={isEditing ? 'Leave blank to keep current' : 'Enter password'}
                      {...field}
                    />
                  </FormControl>
                  {!isEditing && (
                    <FormDescription>
                      Must be at least 8 characters.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password Field */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEditing ? 'Confirm New Password' : 'Confirm Password'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-between pt-4">
              {/* Delete Button (only in edit mode) */}
              {isEditing && onDelete ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isLoading || isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this team member? This action cannot be undone.
                        The user will no longer be able to access the system.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <div /> // Spacer
              )}

              {/* Save/Cancel Buttons */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading || isDeleting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || isDeleting}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? 'Save Changes' : 'Add Member'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

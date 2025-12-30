import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import {
  Upload,
  X,
  File,
  FileImage,
  FileText,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { AttachmentType, UploadProgress } from '@/types/attachment'

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>
  accept?: string
  maxSize?: number // in MB
  maxFiles?: number
  disabled?: boolean
}

const getFileIcon = (type: AttachmentType) => {
  switch (type) {
    case 'image':
      return <FileImage className="h-8 w-8" />
    case 'pdf':
      return <FileText className="h-8 w-8 text-red-500" />
    case 'document':
      return <FileText className="h-8 w-8 text-blue-500" />
    case 'spreadsheet':
      return <FileSpreadsheet className="h-8 w-8 text-green-500" />
    default:
      return <File className="h-8 w-8" />
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUpload({
  onUpload,
  accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx',
  maxSize = 10,
  maxFiles = 5,
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const validateFiles = useCallback(
    (files: File[]): File[] => {
      const validFiles: File[] = []

      for (const file of files) {
        if (file.size > maxSize * 1024 * 1024) {
          toast.error(`${file.name} is too large (max ${maxSize}MB)`)
          continue
        }
        validFiles.push(file)
      }

      if (validFiles.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`)
        return validFiles.slice(0, maxFiles)
      }

      return validFiles
    },
    [maxSize, maxFiles]
  )

  const processFiles = useCallback(
    async (files: File[]) => {
      const validFiles = validateFiles(files)
      if (validFiles.length === 0) return

      // Initialize upload progress
      const newUploads: UploadProgress[] = validFiles.map((file) => ({
        fileId: `${Date.now()}-${file.name}`,
        fileName: file.name,
        progress: 0,
        status: 'pending',
      }))
      setUploads((prev) => [...prev, ...newUploads])

      // Simulate upload progress
      for (let i = 0; i < newUploads.length; i++) {
        const upload = newUploads[i]
        setUploads((prev) =>
          prev.map((u) =>
            u.fileId === upload.fileId ? { ...u, status: 'uploading' } : u
          )
        )

        // Simulate progress
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          setUploads((prev) =>
            prev.map((u) =>
              u.fileId === upload.fileId ? { ...u, progress } : u
            )
          )
        }

        setUploads((prev) =>
          prev.map((u) =>
            u.fileId === upload.fileId
              ? { ...u, status: 'completed', progress: 100 }
              : u
          )
        )
      }

      // Call the actual upload handler
      try {
        await onUpload(validFiles)
        toast.success(`${validFiles.length} file(s) uploaded successfully`)
      } catch (error) {
        toast.error('Upload failed')
        setUploads((prev) =>
          prev.map((u) =>
            u.status === 'uploading'
              ? { ...u, status: 'error', error: 'Upload failed' }
              : u
          )
        )
      }

      // Clear completed uploads after delay
      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.status !== 'completed'))
      }, 2000)
    },
    [validateFiles, onUpload]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      if (disabled) return

      const files = Array.from(e.dataTransfer.files)
      processFiles(files)
    },
    [disabled, processFiles]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || disabled) return
      const files = Array.from(e.target.files)
      processFiles(files)
      e.target.value = ''
    },
    [disabled, processFiles]
  )

  const removeUpload = useCallback((fileId: string) => {
    setUploads((prev) => prev.filter((u) => u.fileId !== fileId))
  }, [])

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">
              Drag and drop files here, or{' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
              >
                browse
              </button>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max {maxSize}MB per file, up to {maxFiles} files
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload) => (
            <div
              key={upload.fileId}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
            >
              <div className="shrink-0">
                {upload.status === 'completed' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : upload.status === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : upload.status === 'uploading' ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <File className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{upload.fileName}</p>
                {upload.status === 'uploading' && (
                  <Progress value={upload.progress} className="h-1 mt-1" />
                )}
                {upload.error && (
                  <p className="text-xs text-red-500 mt-1">{upload.error}</p>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => removeUpload(upload.fileId)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Attachment Gallery Component
interface AttachmentGalleryProps {
  attachments: Array<{
    id: string
    name: string
    type: AttachmentType
    size: number
    url: string
    thumbnailUrl?: string
  }>
  onDelete?: (id: string) => void
  onPreview?: (id: string) => void
}

export function AttachmentGallery({
  attachments,
  onDelete,
  onPreview,
}: AttachmentGalleryProps) {
  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <File className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">No attachments</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="group relative border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
        >
          {/* Preview */}
          <div
            className="aspect-square flex items-center justify-center bg-muted cursor-pointer"
            onClick={() => onPreview?.(attachment.id)}
          >
            {attachment.type === 'image' && attachment.thumbnailUrl ? (
              <img
                src={attachment.thumbnailUrl}
                alt={attachment.name}
                className="w-full h-full object-cover"
              />
            ) : (
              getFileIcon(attachment.type)
            )}
          </div>

          {/* Info */}
          <div className="p-2">
            <p className="text-xs font-medium truncate" title={attachment.name}>
              {attachment.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(attachment.size)}
            </p>
          </div>

          {/* Delete button */}
          {onDelete && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onDelete(attachment.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}

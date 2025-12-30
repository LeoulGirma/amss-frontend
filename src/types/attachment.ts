export type AttachmentType = 'image' | 'pdf' | 'document' | 'spreadsheet' | 'other'

export interface Attachment {
  id: string
  name: string
  type: AttachmentType
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
  uploadedBy: string
  uploadedAt: string
  entityType: 'aircraft' | 'task' | 'part' | 'compliance'
  entityId: string
  description?: string
  tags?: string[]
}

export interface UploadProgress {
  fileId: string
  fileName: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

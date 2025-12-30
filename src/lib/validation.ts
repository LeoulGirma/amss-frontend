// Form validation utilities

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: unknown) => boolean
  message: string
}

export interface FieldValidation {
  [fieldName: string]: ValidationRule[]
}

export interface ValidationErrors {
  [fieldName: string]: string[]
}

export function validateField(value: unknown, rules: ValidationRule[]): string[] {
  const errors: string[] = []

  for (const rule of rules) {
    const strValue = String(value ?? '')

    if (rule.required && (!value || strValue.trim() === '')) {
      errors.push(rule.message)
      continue
    }

    if (!value && !rule.required) {
      continue
    }

    if (rule.minLength && strValue.length < rule.minLength) {
      errors.push(rule.message)
    }

    if (rule.maxLength && strValue.length > rule.maxLength) {
      errors.push(rule.message)
    }

    if (rule.pattern && !rule.pattern.test(strValue)) {
      errors.push(rule.message)
    }

    if (rule.custom && !rule.custom(value)) {
      errors.push(rule.message)
    }
  }

  return errors
}

export function validateForm(
  data: Record<string, unknown>,
  validation: FieldValidation
): ValidationErrors {
  const errors: ValidationErrors = {}

  for (const [fieldName, rules] of Object.entries(validation)) {
    const fieldErrors = validateField(data[fieldName], rules)
    if (fieldErrors.length > 0) {
      errors[fieldName] = fieldErrors
    }
  }

  return errors
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0
}

// Common validation rules
export const commonRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    required: true,
    message,
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message,
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    minLength: length,
    message: message || `Must be at least ${length} characters`,
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    maxLength: length,
    message: message || `Must be no more than ${length} characters`,
  }),

  tailNumber: (message = 'Invalid tail number format'): ValidationRule => ({
    pattern: /^[A-Z0-9]{2,7}$/,
    message,
  }),

  phone: (message = 'Please enter a valid phone number'): ValidationRule => ({
    pattern: /^\+?[\d\s-()]{10,}$/,
    message,
  }),

  numeric: (message = 'Must be a number'): ValidationRule => ({
    pattern: /^\d+$/,
    message,
  }),

  alphanumeric: (message = 'Must contain only letters and numbers'): ValidationRule => ({
    pattern: /^[a-zA-Z0-9]+$/,
    message,
  }),

  date: (message = 'Please enter a valid date'): ValidationRule => ({
    custom: (value) => {
      if (!value) return true
      const date = new Date(String(value))
      return !isNaN(date.getTime())
    },
    message,
  }),

  futureDate: (message = 'Date must be in the future'): ValidationRule => ({
    custom: (value) => {
      if (!value) return true
      const date = new Date(String(value))
      return date > new Date()
    },
    message,
  }),

  positiveNumber: (message = 'Must be a positive number'): ValidationRule => ({
    custom: (value) => {
      const num = Number(value)
      return !isNaN(num) && num > 0
    },
    message,
  }),
}

// Aircraft-specific validation
export const aircraftValidation: FieldValidation = {
  tailNumber: [
    commonRules.required('Tail number is required'),
    commonRules.tailNumber(),
  ],
  aircraftType: [commonRules.required('Aircraft type is required')],
  serialNumber: [commonRules.required('Serial number is required')],
  totalFlightHours: [commonRules.positiveNumber('Flight hours must be positive')],
}

// Task validation
export const taskValidation: FieldValidation = {
  title: [
    commonRules.required('Task title is required'),
    commonRules.minLength(3, 'Title must be at least 3 characters'),
    commonRules.maxLength(100, 'Title must be less than 100 characters'),
  ],
  description: [commonRules.maxLength(500, 'Description must be less than 500 characters')],
  scheduledStart: [
    commonRules.required('Start date is required'),
    commonRules.date(),
  ],
  scheduledEnd: [
    commonRules.required('End date is required'),
    commonRules.date(),
  ],
  estimatedHours: [commonRules.positiveNumber('Estimated hours must be positive')],
}

// User validation
export const userValidation: FieldValidation = {
  email: [
    commonRules.required('Email is required'),
    commonRules.email(),
  ],
  firstName: [
    commonRules.required('First name is required'),
    commonRules.minLength(2, 'First name must be at least 2 characters'),
  ],
  lastName: [
    commonRules.required('Last name is required'),
    commonRules.minLength(2, 'Last name must be at least 2 characters'),
  ],
  phone: [commonRules.phone()],
}

import { Accept, DropzoneOptions } from 'react-dropzone'

export const IMAGE_FILE_TYPES: Accept = {
  'image/jpeg': [],
  'image/png': [],
} satisfies Accept

export const CSV_FILE_TYPES: Accept = {
  'text/csv': [],
} satisfies Accept

export const SPREADSHEET_FILE_TYPES = {
  'application/vnd.ms-excel': [],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
  ...CSV_FILE_TYPES,
} satisfies Accept

export const DOCUMENT_FILE_TYPES = {
  'application/pdf': [],
  'application/msword': [],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
} satisfies Accept

export const ALL_FILE_TYPES = {
  ...DOCUMENT_FILE_TYPES,
  ...IMAGE_FILE_TYPES,
  ...SPREADSHEET_FILE_TYPES,
} satisfies Accept

export const DEFAULT_DROPZONE_OPTIONS = {
  maxSize: 25 * Math.pow(1024, 2), // in bytes
  accept: ALL_FILE_TYPES,
} satisfies DropzoneOptions

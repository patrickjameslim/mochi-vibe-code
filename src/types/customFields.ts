export interface SavedCustomField {
  id: string;
  label: string;
  helperText?: string;
  type: string;
  options?: string[];
  required: boolean;
  visible: boolean;
}

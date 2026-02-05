import React from 'react';
import { cn } from '../../utils/cn';

// Field types supported by the form
export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'code' | 'json';

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface DynamicFormProps {
  fields: FormField[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  className?: string;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  values,
  onChange,
  className,
}) => {
  const renderField = (field: FormField) => {
    const value = values[field.name] ?? '';
    const hasError = field.required && !value;

    const baseInputClass = cn(
      'w-full px-3 py-2 text-sm border rounded-lg transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
      hasError ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
    );

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.name}
            name={field.name}
            value={String(value)}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={field.rows || 3}
            className={cn(baseInputClass, 'resize-none')}
          />
        );

      case 'number':
        return (
          <input
            id={field.name}
            name={field.name}
            type="number"
            value={Number(value)}
            onChange={(e) => onChange(field.name, parseFloat(e.target.value))}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            className={baseInputClass}
          />
        );

      case 'select':
        return (
          <select
            id={field.name}
            name={field.name}
            value={String(value)}
            onChange={(e) => onChange(field.name, e.target.value)}
            className={cn(baseInputClass, 'bg-white')}
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'code':
        return (
          <textarea
            id={field.name}
            name={field.name}
            value={String(value)}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={field.rows || 10}
            className={cn(
              baseInputClass,
              'font-mono text-xs bg-gray-50',
              'resize-none'
            )}
          />
        );

      case 'json':
        return (
          <textarea
            id={field.name}
            name={field.name}
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange(field.name, parsed);
              } catch {
                onChange(field.name, e.target.value);
              }
            }}
            placeholder={field.placeholder || '{\n  \"key\": \"value\"\n}'}
            rows={field.rows || 6}
            className={cn(
              baseInputClass,
              'font-mono text-xs bg-gray-50',
              'resize-none'
            )}
          />
        );

      case 'text':
      default:
        return (
          <input
            id={field.name}
            name={field.name}
            type="text"
            value={String(value)}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
          />
        );
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {fields.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <label
            htmlFor={field.name}
            className="block text-sm font-medium text-gray-700"
          >
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {renderField(field)}
          
          {field.description && (
            <p className="text-xs text-gray-500">{field.description}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default DynamicForm;

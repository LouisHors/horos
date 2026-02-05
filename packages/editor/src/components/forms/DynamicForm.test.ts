import { describe, it, expect } from 'vitest';
import { FormField, FieldType } from './DynamicForm';

describe('DynamicForm Types', () => {
  it('should have all field types', () => {
    const types: FieldType[] = ['text', 'textarea', 'number', 'select', 'code', 'json'];
    expect(types).toHaveLength(6);
  });

  it('should create valid form field', () => {
    const field: FormField = {
      name: 'label',
      label: 'Label',
      type: 'text',
      placeholder: 'Enter label',
      required: true,
    };

    expect(field.name).toBe('label');
    expect(field.type).toBe('text');
    expect(field.required).toBe(true);
  });

  it('should support select field with options', () => {
    const field: FormField = {
      name: 'model',
      label: 'Model',
      type: 'select',
      options: [
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gpt-3.5', label: 'GPT-3.5' },
      ],
    };

    expect(field.options).toHaveLength(2);
    expect(field.options?.[0].value).toBe('gpt-4');
  });

  it('should support number field with constraints', () => {
    const field: FormField = {
      name: 'temperature',
      label: 'Temperature',
      type: 'number',
      min: 0,
      max: 2,
      step: 0.1,
    };

    expect(field.min).toBe(0);
    expect(field.max).toBe(2);
    expect(field.step).toBe(0.1);
  });
});

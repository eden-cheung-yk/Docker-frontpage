import React, { useState } from 'react';
import { Eye, EyeOff, X, Plus } from 'lucide-react';
import type { SettingsField } from '../types';

interface SettingsFormProps {
  schema: SettingsField[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 'var(--border-radius)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: '14px',
  transition: 'border var(--transition-fast)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-heading)',
};

function TextField({ field, value, onChange }: { field: SettingsField; value: string; onChange: (v: string) => void }) {
  return <input style={inputBase} type={field.type === 'url' ? 'url' : 'text'} value={value} placeholder={field.placeholder} onChange={e => onChange(e.target.value)} />;
}

function NumberField({ field, value, onChange }: { field: SettingsField; value: number; onChange: (v: number) => void }) {
  return <input style={inputBase} type="number" value={value} min={field.min} max={field.max} onChange={e => onChange(Number(e.target.value))} />;
}

function SelectField({ field, value, onChange }: { field: SettingsField; value: string; onChange: (v: string) => void }) {
  return (
    <select style={{ ...inputBase, cursor: 'pointer' }} value={value} onChange={e => onChange(e.target.value)}>
      {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function ToggleField({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        width: 48, height: 26, borderRadius: 13,
        background: value ? 'var(--accent-primary)' : 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        position: 'relative', transition: 'background var(--transition-fast)',
        cursor: 'pointer', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: value ? 24 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: value ? 'var(--bg-primary)' : 'var(--text-muted)',
        transition: 'left var(--transition-fast)',
      }} />
    </button>
  );
}

function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <input type="color" value={value || '#fef08a'} onChange={e => onChange(e.target.value)}
        style={{ width: 40, height: 40, border: 'none', borderRadius: 'var(--border-radius)', cursor: 'pointer', background: 'none' }} />
      <input style={{ ...inputBase, flex: 1 }} value={value} onChange={e => onChange(e.target.value)} placeholder="#hex" />
    </div>
  );
}

function PasswordField({ field, value, onChange }: { field: SettingsField; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input style={{ ...inputBase, paddingRight: 42 }} type={show ? 'text' : 'password'} value={value} placeholder={field.placeholder} onChange={e => onChange(e.target.value)} />
      <button type="button" onClick={() => setShow(!show)}
        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function TextareaField({ field, value, onChange }: { field: SettingsField; value: string; onChange: (v: string) => void }) {
  return <textarea style={{ ...inputBase, minHeight: 80, resize: 'vertical' }} value={value} placeholder={field.placeholder} onChange={e => onChange(e.target.value)} />;
}

function TagsField({ field, value, onChange }: { field: SettingsField; value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput('');
    }
  };
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: value.length ? 8 : 0 }}>
        {value.map(tag => (
          <span key={tag} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 20,
            background: 'var(--accent-primary)', color: 'var(--bg-primary)',
            fontSize: '12px', fontWeight: 600,
          }}>
            {tag}
            <button type="button" onClick={() => onChange(value.filter(t => t !== tag))} style={{ display: 'flex' }}>
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input style={{ ...inputBase, flex: 1 }} value={input} placeholder={field.placeholder}
          onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <button type="button" onClick={add} style={{
          padding: '8px 12px', borderRadius: 'var(--border-radius)',
          background: 'var(--accent-primary)', color: 'var(--bg-primary)',
          display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600,
        }}>
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}

export default function SettingsForm({ schema, values, onChange }: SettingsFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {schema.map(field => {
        const val = values[field.key] ?? field.defaultValue;
        return (
          <div key={field.key}>
            <label style={labelStyle}>{field.label}</label>
            {field.type === 'text' && <TextField field={field} value={val as string} onChange={v => onChange(field.key, v)} />}
            {field.type === 'url' && <TextField field={field} value={val as string} onChange={v => onChange(field.key, v)} />}
            {field.type === 'number' && <NumberField field={field} value={val as number} onChange={v => onChange(field.key, v)} />}
            {field.type === 'select' && <SelectField field={field} value={val as string} onChange={v => onChange(field.key, v)} />}
            {field.type === 'toggle' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <ToggleField value={val as boolean} onChange={v => onChange(field.key, v)} />
              </div>
            )}
            {field.type === 'color' && <ColorField value={val as string} onChange={v => onChange(field.key, v)} />}
            {field.type === 'password' && <PasswordField field={field} value={val as string} onChange={v => onChange(field.key, v)} />}
            {field.type === 'textarea' && <TextareaField field={field} value={val as string} onChange={v => onChange(field.key, v)} />}
            {field.type === 'tags' && <TagsField field={field} value={(val as string[]) || []} onChange={v => onChange(field.key, v)} />}
          </div>
        );
      })}
    </div>
  );
}

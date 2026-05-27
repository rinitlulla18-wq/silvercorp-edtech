import React, { useState } from 'react';
import type { Credential } from '../types';
import { PlusIcon, SaveIcon, TrashIcon, EyeIcon, EyeSlashIcon, CopyIcon, CheckIcon, EditIcon } from './icons';

const CredentialRow: React.FC<{
  credential: Credential;
  onUpdate: (id: string, field: keyof Credential, value: string) => void;
  onDelete: (id: string) => void;
}> = ({ credential, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(credential.link === '' && credential.userId === '');
    const [isPassVisible, setIsPassVisible] = useState(false);
    const [copied, setCopied] = useState('');

    const handleCopy = (text: string, field: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(''), 2000);
    };

    const inputClasses = (isEditing: boolean) => `w-full p-2 border rounded-md shadow-sm text-sm transition-all ${
        isEditing 
        ? "border-slate-600 bg-slate-900 focus:ring-blue-500 focus:border-blue-500 text-slate-200" 
        : "border-transparent bg-transparent text-slate-400 cursor-default focus:outline-none"
    }`;

    const renderField = (field: keyof Credential, placeholder: string, type: string = 'text', isSecret: boolean = false) => {
        const value = credential[field] as string;
        return (
            <div className="relative group/field flex items-center">
                <input 
                    type={isSecret && !isPassVisible ? 'password' : 'text'} 
                    value={value} 
                    onChange={e => onUpdate(credential.id, field, e.target.value)} 
                    readOnly={!isEditing}
                    className={`${inputClasses(isEditing)} ${field === 'link' ? 'text-blue-400' : ''} ${isSecret ? 'pr-16' : (isEditing ? '' : 'pr-8')}`}
                    placeholder={placeholder}
                />
                {!isEditing && value && (
                    <div className="absolute right-0 flex items-center pr-2 space-x-1">
                        {isSecret && (
                            <button onClick={() => setIsPassVisible(!isPassVisible)} className="text-slate-500 hover:text-blue-400 p-1">
                                {isPassVisible ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                            </button>
                        )}
                        <button onClick={() => handleCopy(value, field)} className="text-slate-500 hover:text-blue-400 p-1" title="Copy">
                            {copied === field ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <tr className="border-b border-slate-700 bg-slate-800 hover:bg-slate-700/50 transition-colors">
            <td className="p-2 align-middle">{renderField('link', 'e.g., portal.university.com')}</td>
            <td className="p-2 align-middle">{renderField('userId', 'User ID')}</td>
            <td className="p-2 align-middle">{renderField('pass', 'Password', 'password', true)}</td>
            <td className="p-2 align-middle">{renderField('remark', 'Remark')}</td>
            <td className="p-2 align-middle">{renderField('additionalRemark', 'Additional Remark')}</td>
            <td className="p-2 align-middle text-right whitespace-nowrap">
                <div className="flex items-center justify-end space-x-2">
                    {isEditing ? (
                        <button 
                            onClick={() => setIsEditing(false)} 
                            className="p-2 text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors flex items-center space-x-1" 
                            aria-label="Save credential"
                        >
                            <SaveIcon className="w-4 h-4" />
                            <span className="text-xs font-medium">Save</span>
                        </button>
                    ) : (
                        <button 
                            onClick={() => setIsEditing(true)} 
                            className="p-2 text-slate-400 hover:text-blue-400 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors" 
                            aria-label="Edit credential"
                        >
                            <EditIcon className="w-4 h-4" />
                        </button>
                    )}
                    <button onClick={() => onDelete(credential.id)} className="p-2 text-slate-400 hover:text-red-400 bg-slate-700 hover:bg-red-900/30 rounded-md transition-colors" aria-label="Delete credential">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

interface CredentialsTabProps {
  credentials: Credential[];
  onUpdate: (id: string, field: keyof Credential, value: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export const CredentialsTab: React.FC<CredentialsTabProps> = ({ credentials, onUpdate, onAdd, onDelete }) => {
  return (
    <div className="bg-slate-800 rounded-lg shadow-md p-6 border border-slate-700">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-6">
        <h2 className="text-xl font-bold text-white">Important Credentials</h2>
        <button onClick={onAdd} className="flex items-center px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add New Credential
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1024px] border-collapse text-left">
          <thead className="bg-slate-900">
            <tr>
              {['Link', 'User ID', 'Password', 'Remark', 'Additional Remark', 'Actions'].map(header => (
                <th key={header} className={`p-3 text-xs font-bold text-slate-500 uppercase tracking-wider ${header === 'Actions' ? 'text-right' : ''}`}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {credentials.map(cred => (
                <CredentialRow 
                    key={cred.id} 
                    credential={cred}
                    onUpdate={onUpdate} 
                    onDelete={onDelete} 
                />
            ))}
          </tbody>
        </table>
        {credentials.length === 0 && (
             <div className="text-center py-12 text-slate-500">
                <p>No credentials saved.</p>
                <p className="text-sm">Click "Add New Credential" to get started.</p>
            </div>
        )}
      </div>
    </div>
  );
};
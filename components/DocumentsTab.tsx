import React, { useState } from 'react';
import type { AppDocument } from '../types';
import { UploadCloudIcon, FileIcon, XCircleIcon, EyeIcon, DownloadIcon, TrashIcon } from './icons';

const MAX_FILE_SIZE_MB = 3;

interface DocumentsTabProps {
  documents: AppDocument[];
  onAddDocuments: (files: File[]) => void;
  onRemoveDocument: (id: string) => void;
  onUploadDocument: (id: string) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUploadTimestamp = (date: Date): string => {
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ documents, onAddDocuments, onRemoveDocument, onUploadDocument }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileSelection = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    onAddDocuments(Array.from(selectedFiles));
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files);
      e.target.value = '';
    }
  };
  
  const handleUpload = () => {
    const filesToUpload = documents.filter(f => f.status === 'pending');
    if(filesToUpload.length === 0) return;
    filesToUpload.forEach(fileToUpload => {
      onUploadDocument(fileToUpload.id);
    });
  };

  const handlePreview = (file: File) => {
    const fileURL = URL.createObjectURL(file);
    window.open(fileURL, '_blank');
  };

  const handleDownload = (file: File) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(file);
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
  };
  
  const pendingFilesCount = documents.filter(f => f.status === 'pending').length;

  return (
    <div className="bg-slate-800 rounded-lg shadow-md p-6 min-h-[400px] border border-slate-700">
      <h2 className="text-xl font-bold text-white mb-4">Upload Documents</h2>
      <div 
        onDragEnter={onDrag} 
        onDragLeave={onDrag} 
        onDragOver={onDrag} 
        onDrop={onDrop}
        className="relative"
      >
        <label 
          htmlFor="file-upload" 
          className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-12 text-center transition-colors duration-200 cursor-pointer ${isDragActive ? 'border-blue-500 bg-blue-900/20' : 'border-slate-600 bg-slate-900/50 hover:bg-slate-900'}`}
        >
          <UploadCloudIcon className="w-12 h-12 text-slate-500 mb-4" />
          <p className="text-slate-300 font-semibold">
            Drag & drop files here, or <span className="text-blue-400">click to browse</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Any file type. Max file size: {MAX_FILE_SIZE_MB} MB.
          </p>
        </label>
        <input
          type="file"
          id="file-upload"
          multiple
          onChange={onFileChange}
          className="sr-only"
        />
      </div>

      {documents.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-lg font-semibold text-slate-200">Selected Files ({documents.length})</h3>
          <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
            {documents.map((fileWrapper) => (
              <div key={fileWrapper.id} className="p-3 bg-slate-900 rounded-lg border border-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex items-start min-w-0 flex-1">
                    <FileIcon className="w-8 h-8 text-slate-500 mr-4 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                      <div className="flex items-baseline flex-wrap gap-x-2">
                        <p className="text-sm font-medium text-slate-200 truncate">{fileWrapper.file.name}</p>
                        {fileWrapper.status === 'success' && fileWrapper.uploadedBy && fileWrapper.uploadedAt && (
                          <p className="text-xs text-slate-500">
                            Uploaded by <span className="font-medium text-slate-400">{fileWrapper.uploadedBy}</span> on {formatUploadTimestamp(fileWrapper.uploadedAt)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-slate-500 mt-0.5">
                        <span>{formatFileSize(fileWrapper.file.size)}</span>
                        {fileWrapper.status === 'success' && <span className="mx-2">·</span>}
                        {fileWrapper.status === 'success' && <span className="text-green-400 font-medium">Upload complete!</span>}
                        {fileWrapper.status === 'error' && <span className="mx-2">·</span>}
                        {fileWrapper.status === 'error' && <span className="text-red-400 font-medium">{fileWrapper.error}</span>}
                      </div>
                      {fileWrapper.status === 'uploading' && (
                        <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${fileWrapper.progress}%`, transition: 'width 0.2s ease-in-out' }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center self-end sm:self-start space-x-1">
                      {fileWrapper.status === 'success' ? (
                          <>
                              <button onClick={() => handlePreview(fileWrapper.file)} className="p-2 text-slate-500 hover:text-blue-400 transition-colors rounded-full hover:bg-slate-800" aria-label={`Preview ${fileWrapper.file.name}`}>
                                  <EyeIcon className="w-5 h-5" />
                              </button>
                              <button onClick={() => handleDownload(fileWrapper.file)} className="p-2 text-slate-500 hover:text-green-400 transition-colors rounded-full hover:bg-slate-800" aria-label={`Download ${fileWrapper.file.name}`}>
                                  <DownloadIcon className="w-5 h-5" />
                              </button>
                              <button onClick={() => onRemoveDocument(fileWrapper.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-full hover:bg-slate-800" aria-label={`Delete ${fileWrapper.file.name}`}>
                                  <TrashIcon className="w-5 h-5" />
                              </button>
                          </>
                      ) : (
                          <button 
                              onClick={() => onRemoveDocument(fileWrapper.id)} 
                              className="p-1 text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
                              aria-label={`Remove ${fileWrapper.file.name}`}
                          >
                              <XCircleIcon className="w-6 h-6" />
                          </button>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
             <button 
                onClick={handleUpload}
                disabled={pendingFilesCount === 0}
                className="px-6 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
             >
                Upload {pendingFilesCount > 0 ? `${pendingFilesCount} file(s)` : 'Files'}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
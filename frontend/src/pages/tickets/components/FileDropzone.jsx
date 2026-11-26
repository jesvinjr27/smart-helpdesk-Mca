import React, { useRef, useState } from 'react';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const getFileIcon = (mimeType = '', filename = '') => {
  const ext = filename.split('.').pop().toLowerCase();
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    return 'bi-file-earmark-image text-brand-primary';
  }
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return 'bi-file-earmark-pdf text-red-500';
  }
  if (['zip', 'tar', 'gz', '7z', 'rar'].includes(ext)) {
    return 'bi-file-earmark-zip text-yellow-600';
  }
  if (['txt', 'log', 'csv', 'json', 'xml'].includes(ext)) {
    return 'bi-file-earmark-code text-brand-primary';
  }
  return 'bi-file-earmark-text text-brand-secondary';
};

export const FileDropzone = ({ files, setFiles, error, setError }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (newFiles) => {
    setError('');
    const validFiles = [];
    const incomingList = Array.from(newFiles);

    if (files.length + incomingList.length > MAX_FILES) {
      setError(`You can attach a maximum of ${MAX_FILES} files.`);
      return;
    }

    for (const f of incomingList) {
      if (f.size > MAX_FILE_SIZE_BYTES) {
        setError(`"${f.name}" exceeds the maximum 10 MB size limit.`);
        return;
      }
      // Check duplicate by name + size
      if (files.some((existing) => existing.name === f.name && existing.size === f.size)) {
        continue;
      }
      // Add preview URL for images
      if (f.type.startsWith('image/')) {
        f.previewUrl = URL.createObjectURL(f);
      }
      validFiles.push(f);
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles((prev) => {
      const target = prev[indexToRemove];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary">
          Attach Screenshots or Diagnostics (Optional)
        </label>
        <span className="text-[11px] text-brand-secondary">
          {files.length}/{MAX_FILES} files (Max 10MB each)
        </span>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-brand-primary bg-brand-secondary/20 scale-[0.99]'
            : 'border-brand-secondary/40 bg-app-background hover:bg-brand-secondary/10 hover:border-brand-primary/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*,.pdf,.txt,.log,.csv,.zip,.docx"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />

        <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-xl bg-brand-secondary/20 text-brand-primary flex items-center justify-center mb-2.5">
          <i className="bi bi-cloud-arrow-up text-xl sm:text-2xl" />
        </div>
        <p className="text-xs sm:text-sm font-semibold text-brand-primary m-0">
          <span className="underline decoration-brand-secondary/60">Click to browse</span> or drag and drop files here
        </p>
        <p className="text-[11px] text-brand-secondary mt-1 m-0">
          Supports PNG, JPG, PDF, TXT, LOG, CSV, ZIP (up to 10 MB per file)
        </p>
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-brand-primary/10 border border-brand-primary/30 text-xs text-brand-primary flex items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill text-brand-primary text-sm flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Uploaded Files Previews */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between p-2.5 rounded-xl bg-app-background border border-brand-primary/15 shadow-sm group hover:border-brand-primary/35 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {file.previewUrl ? (
                  <img
                    src={file.previewUrl}
                    alt={file.name}
                    className="w-9 h-9 object-cover rounded-lg border border-brand-secondary/30 flex-shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-brand-secondary/20 flex items-center justify-center flex-shrink-0 text-lg">
                    <i className={`bi ${getFileIcon(file.type, file.name)}`} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-brand-primary truncate m-0 leading-tight">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-brand-secondary m-0 leading-tight mt-0.5">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(idx);
                }}
                className="w-7 h-7 rounded-lg text-brand-secondary hover:text-brand-primary hover:bg-brand-secondary/20 flex items-center justify-center transition-colors flex-shrink-0 ml-2"
                title="Remove file"
              >
                <i className="bi bi-trash3 text-xs" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { uploadMyAvatarApi, removeMyAvatarApi } from '../../../api';
import { useToast } from '../../../context/ToastContext';

export const AvatarUploadModal = ({ isOpen, onClose, currentAvatarUrl, onAvatarUpdated }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const { showSuccess, showError } = useToast();

  if (!isOpen) return null;

  const handleFile = (file) => {
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      showError('Please select a valid image file (JPEG, PNG, WebP, or GIF).');
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Image size must be less than 5MB.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await uploadMyAvatarApi(formData);
      showSuccess('Profile photo updated successfully!');
      onAvatarUpdated(res.data.avatar_url);
      handleClose();
    } catch (err) {
      showError(err.response?.data?.detail || 'Failed to upload profile photo.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      await removeMyAvatarApi();
      showSuccess('Profile photo removed.');
      onAvatarUpdated(null);
      handleClose();
    } catch (err) {
      showError(err.response?.data?.detail || 'Failed to remove avatar.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    onClose();
  };

  const displayImage = previewUrl || currentAvatarUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-app-background w-full max-w-md rounded-2xl shadow-2xl border border-brand-primary/20 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-brand-primary/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-primary text-white flex items-center justify-center text-sm">
              <i className="bi bi-camera" />
            </div>
            <h3 className="font-bold text-base text-brand-primary">Update Profile Photo</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-brand-secondary hover:text-brand-primary p-1 rounded-lg hover:bg-brand-secondary/15 transition-colors"
          >
            <i className="bi bi-x-lg text-sm" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Preview Area */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative group">
              <div className="w-28 h-28 rounded-2xl border-2 border-brand-secondary/40 overflow-hidden bg-brand-primary/10 flex items-center justify-center shadow-inner">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <i className="bi bi-person text-5xl text-brand-secondary" />
                )}
              </div>
              {selectedFile && (
                <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shadow-sm">
                  <i className="bi bi-check" />
                </span>
              )}
            </div>
            <p className="text-xs text-brand-secondary mt-2">
              {selectedFile ? selectedFile.name : 'Square image recommended (at least 200×200px)'}
            </p>
          </div>

          {/* Drag & Drop Target */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-brand-primary bg-brand-accent/20'
                : 'border-brand-primary/25 hover:border-brand-primary/60 hover:bg-brand-secondary/10'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => e.target.files && handleFile(e.target.files[0])}
            />
            <i className="bi bi-cloud-arrow-up text-3xl text-brand-secondary block mb-1.5" />
            <span className="text-xs font-semibold text-brand-primary block">
              Click to browse or drag and drop image here
            </span>
            <span className="text-[11px] text-brand-secondary mt-1 block">
              Supports JPEG, PNG, WebP, GIF (Max 5MB)
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-brand-primary/10 bg-brand-secondary/5">
          {currentAvatarUrl ? (
            <button
              type="button"
              onClick={handleRemove}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <i className="bi bi-trash" />
              <span>Remove Photo</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-3.5 py-1.5 text-xs font-medium text-brand-primary hover:bg-brand-secondary/20 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || loading}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              {loading && <i className="bi bi-arrow-repeat animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

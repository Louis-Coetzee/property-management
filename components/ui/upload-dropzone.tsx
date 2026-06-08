'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader2, Upload, Check, Image as ImageIcon, AlertTriangle, FileText } from 'lucide-react';

export interface UploadDropzoneProps {
  onImageUploaded: (url: string, file: File) => void;
  maxFiles?: number;
  userId: string;
  selectedCategory?: string;
  selectedCategories?: string[];
  disabled?: boolean;
  onCategoriesChange?: (categories: string[]) => void;
  hideInstructions?: boolean;
}

// Helper function to get cookie value
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  return null;
}

export function UploadDropzone({ 
  onImageUploaded, 
  maxFiles = 1,
  userId,
  selectedCategories = [],
  disabled = false,
  hideInstructions = false
}: UploadDropzoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessages, setSuccessMessages] = useState<Array<{fileName: string, fileType: 'image' | 'document', tabName: string}>>([]);

  // Helper function to determine file type
  const getFileType = (file: File): 'image' | 'document' => {
    return file.type.startsWith('image/') ? 'image' : 'document';
  };

  // Helper function to get tab name for file type
  const getTabName = (fileType: 'image' | 'document'): string => {
    return fileType === 'image' ? 'Images' : 'Documents';
  };
  

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > maxFiles) {
      // Using console.error as fallback for toast
      console.error(`You can only upload up to ${maxFiles} files at once`);
      acceptedFiles = acceptedFiles.slice(0, maxFiles);
    }

    setUploadQueue(acceptedFiles);
    setIsUploading(true);

    // Clear previous errors and success messages
    setErrors([]);
    setSuccessMessages([]);
    
    // Process each file
    for (const file of acceptedFiles) {
      try {
        // Initialize progress for this file
        const fileName = file.name;
        setUploadProgress(prev => ({ ...prev, [fileName]: 0 }));
        
        // Create form data for the file
        const formData = new FormData();
        formData.append('file', file);
        
        // Add categories to form data if selected
        if (selectedCategories.length > 0) {
          formData.append('categories', JSON.stringify(selectedCategories));
        }
        
        // Upload the file with progress monitoring
        const xhr = new XMLHttpRequest();
        
        // Set up progress monitoring
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(prev => ({ ...prev, [fileName]: percentComplete }));
          }
        });
        
        // Use a Promise to handle the XHR request
        const uploadResult = await new Promise<{ success: boolean; url?: string; error?: string }>((resolve, reject) => {
          xhr.open('POST', '/api/upload');
          
          // Get the session token from cookie and add to Authorization header
          const sessionToken = getCookie('sessionToken') || getCookie('session_token') || getCookie('auth_token');
          console.log('Upload session token:', sessionToken ? `${sessionToken.substring(0, 6)}...` : 'none');
          
          if (sessionToken) {
            xhr.setRequestHeader('Authorization', `Bearer ${sessionToken}`);
            // Also set the token as a custom header as a backup
            xhr.setRequestHeader('X-Session-Token', sessionToken);
          } else {
            console.warn('No session token found in cookies for upload authorization');
          }
          
          // Set user ID as a header for additional authentication
          xhr.setRequestHeader('X-User-ID', userId);
          
          // Set categories in header
          if (selectedCategories.length > 0) {
            xhr.setRequestHeader('X-Categories', JSON.stringify(selectedCategories));
          }
          
          // Set cookies directly in the request header as well
          const allCookies = document.cookie;
          if (allCookies) {
            xhr.setRequestHeader('Cookie', allCookies);
          }
          
          xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                console.log('Upload response:', data);
                resolve(data);
              } catch {
                console.error('Failed to parse upload response');
                console.error('Raw response:', xhr.responseText);
                reject(new Error('Invalid response from server'));
              }
            } else {
              try {
                const errorData = JSON.parse(xhr.responseText);
                console.error('Upload failed with response:', errorData);
                console.error('Status code:', xhr.status);
                reject(new Error(errorData.error || `Upload failed with status ${xhr.status}`));
              } catch {
                console.error('Upload failed with status:', xhr.status, xhr.statusText);
                console.error('Raw response:', xhr.responseText);
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            }
          };
          
          xhr.onerror = function() {
            console.error('Network error during upload');
            reject(new Error('Network error during upload'));
          };
          
          xhr.send(formData);
        });
        
        // Mark upload as complete for this file
        setUploadProgress(prev => ({ ...prev, [fileName]: 100 }));
        
        if (uploadResult.success && uploadResult.url) {
          console.log('Upload successful:', uploadResult.url);
          onImageUploaded(uploadResult.url, file);

          // Add success message
          const fileType = getFileType(file);
          const tabName = getTabName(fileType);
          setSuccessMessages(prev => [...prev, { fileName: file.name, fileType, tabName }]);

          // Dispatch custom event to notify media library of new upload
          const event = new CustomEvent('media-upload-completed', {
            detail: { url: uploadResult.url, file }
          });
          document.dispatchEvent(event);

          console.log(`Successfully uploaded ${file.name}`);
        } else {
          const errorMessage = uploadResult.error || 'Upload failed';
          console.error('Upload failed:', errorMessage);
          setErrors(prev => [...prev, `${file.name}: ${errorMessage}`]);
        }
        
      } catch (error) {
        console.error('Upload error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setErrors(prev => [...prev, `${file.name}: ${errorMessage}`]);
      }
    }
    
    // Reset upload state
    setTimeout(() => {
      setIsUploading(false);
      setUploadQueue([]);
      setUploadProgress({});
    }, 1000);
  }, [maxFiles, onImageUploaded, selectedCategories, userId]);

  // Auto-dismiss success messages after 8 seconds
  useEffect(() => {
    if (successMessages.length > 0) {
      const timeout = setTimeout(() => {
        setSuccessMessages([]);
      }, 8000);
      return () => clearTimeout(timeout);
    }
  }, [successMessages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'application/rtf': ['.rtf'],
      'text/csv': ['.csv'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar'],
      'application/x-7z-compressed': ['.7z'],
      'audio/mpeg': ['.mp3'],
      'video/mp4': ['.mp4'],
      'video/x-msvideo': ['.avi'],
      'video/quicktime': ['.mov'],
      'application/json': ['.json'],
      'application/xml': ['.xml'],
      'text/markdown': ['.md']
    },
    maxFiles,
    disabled: disabled || isUploading
  });

  return (
    <div className="w-full space-y-4">
      {/* Upload area */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Uploading files...</p>
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div key={fileName} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="truncate max-w-[200px]">{fileName}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              {isDragActive ? (
                <Upload className="h-8 w-8 text-blue-500" />
              ) : (
                <ImageIcon className="h-8 w-8 text-gray-400" />
              )}
            </div>
            
            {!hideInstructions && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  {isDragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500">
                  Images, documents, videos, and archives up to 10MB each
                  {maxFiles > 1 && ` (max ${maxFiles} files)`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Error messages */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Success messages */}
      {successMessages.length > 0 && (
        <div className="space-y-2">
          {successMessages.map((msg, index) => (
            <div key={index} className="flex items-start gap-2 text-sm text-green-700 bg-green-50 p-3 rounded border border-green-200">
              <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Successfully uploaded {msg.fileType === 'image' ? 'image' : 'document'}!</p>
                <p className="text-xs text-green-600 mt-1">
                  {msg.fileName} has been uploaded and is available in the <span className="font-semibold">{msg.tabName}</span> tab
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload queue */}
      {uploadQueue.length > 0 && !isUploading && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Files ready to upload:</p>
          {uploadQueue.map((file, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
              <Check className="h-4 w-4 text-green-500" />
              <span className="truncate">{file.name}</span>
              <span className="text-xs">({Math.round(file.size / 1024)} KB)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
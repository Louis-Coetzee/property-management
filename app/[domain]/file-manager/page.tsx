'use client';

import { useState, useEffect } from 'react';
import { useAuthGuard, useAuth } from '@/app/[domain]/AuthProvider';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { NavigationMenuButton, NavigationSideSheet } from '@/components/navigation/NavigationSideSheet';
import {
  FolderOpen,
  Folder,
  File,
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  Archive,
  Plus,
  Search,
  Grid3x3,
  List,
  MoreVertical,
  Upload,
  FolderPlus,
  Trash2,
  Edit,
  Download,
  Share,
  ArrowLeft,
  Home,
  ChevronRight,
  X,
  Check,
  Loader2,
  RefreshCw,
  Users,
  Mail,
  AtSign,
  Play,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';

// File type icons mapping
const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'image':
      return ImageIcon;
    case 'video':
      return Video;
    case 'audio':
      return Music;
    case 'archive':
      return Archive;
    default:
      return FileText;
  }
};

// File type colors
const getFileColor = (fileType: string) => {
  switch (fileType) {
    case 'image':
      return 'from-purple-500 to-purple-600';
    case 'video':
      return 'from-red-500 to-red-600';
    case 'audio':
      return 'from-pink-500 to-pink-600';
    case 'archive':
      return 'from-amber-500 to-amber-600';
    default:
      return 'from-blue-500 to-blue-600';
  }
};

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

type ViewMode = 'grid' | 'list';
type SelectionItem = { id: string; type: 'file' | 'folder' };
type SharePermission = 'view' | 'edit' | 'read-write';

export default function FileManagerPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const { domain } = useAuth();
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [folderPath, setFolderPath] = useState<any[]>([]);
  const [createFolderForm, setCreateFolderForm] = useState({ name: '', color: '#3b82f6', description: '' });
  const [editFolderForm, setEditFolderForm] = useState({ name: '', color: '', description: '' });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);

  // Share form state
  const [shareForm, setShareForm] = useState({
    selectedUsers: new Set<string>(),
    permission: 'view' as SharePermission,
    sendEmail: false,
    message: '',
  });
  const [isSharing, setIsSharing] = useState(false);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'file' | 'folder'; name: string } | null>(null);

  // Rename modal state
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [itemToRename, setItemToRename] = useState<{ id: string; type: 'file' | 'folder'; name: string } | null>(null);
  const [renameForm, setRenameForm] = useState({ name: '' });

  // Options menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Move modal state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [itemToMove, setItemToMove] = useState<{ id: string; type: 'file' | 'folder'; name: string } | null>(null);
  const [selectedMoveFolder, setSelectedMoveFolder] = useState<string | null>(null);

  // Queries
  const companies = useQuery(api.companies.getCompaniesByUser, user?.id ? {
    userId: user?.id as any,
  } : 'skip');
  const folders = useQuery(api.fileManager.getFoldersByCompany, (currentCompanyId && user?.id) ? {
    companyId: currentCompanyId as Id<'companies'>,
    userId: user?.id as any,
  } : 'skip');
  const files = useQuery(api.fileManager.getFilesByCompany, (currentCompanyId && user?.id) ? {
    companyId: currentCompanyId as Id<'companies'>,
    userId: user?.id as any,
    ...(currentFolderId ? { folderId: currentFolderId as Id<'mediaFolders'> } : {}),
  } : 'skip');
  const storageStats = useQuery(api.fileManager.getStorageStats, (currentCompanyId && user?.id) ? {
    companyId: currentCompanyId as Id<'companies'>,
    userId: user?.id as any,
  } : 'skip');
  const companyUsers = useQuery(api.auth.getByCompanyId, currentCompanyId ? {
    companyId: currentCompanyId as Id<'companies'>,
  } : 'skip');

  // Mutations
  const createFolder = useMutation(api.fileManager.createFolder);
  const updateFolder = useMutation(api.fileManager.updateFolder);
  const deleteFolder = useMutation(api.fileManager.deleteFolder);
  const moveFolder = useMutation(api.fileManager.moveFolder);
  const createFile = useMutation(api.fileManager.createFile);
  const updateFile = useMutation(api.fileManager.updateFile);
  const deleteFile = useMutation(api.fileManager.deleteFile);
  const moveFile = useMutation(api.fileManager.moveFile);
  const batchDeleteFiles = useMutation(api.fileManager.batchDeleteFiles);
  const batchMoveFiles = useMutation(api.fileManager.batchMoveFiles);

  // Actions
  const shareFileWithNotification = useAction(api.fileManagerActions.shareFileWithNotificationAction);
  const shareFolderWithNotification = useAction(api.fileManagerActions.shareFolderWithNotificationAction);

  useEffect(() => {
    // useAuthGuard handles the redirect automatically
  }, []);

  useEffect(() => {
    if (companies && companies.length > 0 && !currentCompanyId) {
      setCurrentCompanyId(companies[0]?._id || null);
    }
  }, [companies, currentCompanyId]);

  // Filter current folder's subfolders and files
  const currentSubfolders = folders?.filter((f) =>
    currentFolderId === null
      ? (f.parentId === null || f.parentId === undefined)
      : f.parentId === currentFolderId
  ) || [];
  const currentFiles = files || [];

  // Filter by search
  const filteredSubfolders = currentSubfolders.filter((folder) =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredFiles = currentFiles.filter((file) =>
    file.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle folder navigation
  const handleFolderClick = async (folder: any) => {
    setCurrentFolderId(folder._id);
    setFolderPath([...folderPath, { id: folder._id, name: folder.name }]);
    setSelectedItems(new Set());
  };

  const handleBreadcrumbClick = async (index: number) => {
    if (index === -1) {
      // Root
      setCurrentFolderId(null);
      setFolderPath([]);
    } else {
      const newFolderPath = folderPath.slice(0, index + 1);
      setFolderPath(newFolderPath);
      setCurrentFolderId(newFolderPath[newFolderPath.length - 1].id);
    }
    setSelectedItems(new Set());
  };

  // Handle create folder
  const handleCreateFolder = async () => {
    if (!createFolderForm.name.trim() || !currentCompanyId) return;

    try {
      await createFolder({
        companyId: currentCompanyId as Id<'companies'>,
        userId: user?.id as Id<'users'>,
        name: createFolderForm.name,
        description: createFolderForm.description,
        ...(currentFolderId ? { parentId: currentFolderId as Id<'mediaFolders'> } : {}),
        color: createFolderForm.color,
      });
      toast.success('Folder created successfully');
      setShowCreateFolderModal(false);
      setCreateFolderForm({ name: '', color: '#3b82f6', description: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create folder');
    }
  };

  // Handle edit folder
  const handleEditFolder = async () => {
    if (!selectedFolder) return;

    try {
      await updateFolder({
        folderId: selectedFolder._id,
        name: editFolderForm.name,
        description: editFolderForm.description,
        color: editFolderForm.color,
      });
      toast.success('Folder updated successfully');
      setShowEditFolderModal(false);
      setSelectedFolder(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update folder');
    }
  };

  // Handle delete folder
  const handleDeleteFolder = (folder: any) => {
    setItemToDelete({ id: folder._id, type: 'folder', name: folder.name });
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'folder') {
        await deleteFolder({ folderId: itemToDelete.id as Id<'mediaFolders'> });
        toast.success('Folder deleted successfully');
      } else {
        await deleteFile({ fileId: itemToDelete.id as Id<'mediaLibrary'> });
        toast.success('File deleted successfully');
      }
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete');
    }
  };

  // Handle rename item (folder or file)
  const handleRename = (item: any) => {
    setItemToRename({ id: item._id, type: 'file' in item ? 'file' : 'folder', name: item.name || item.filename });
    setRenameForm({ name: item.name || item.filename });
    setShowRenameModal(true);
  };

  // Confirm rename
  const confirmRename = async () => {
    if (!itemToRename || !renameForm.name.trim()) return;

    try {
      if (itemToRename.type === 'folder') {
        await updateFolder({
          folderId: itemToRename.id as Id<'mediaFolders'>,
          name: renameForm.name.trim(),
        });
        toast.success('Folder renamed successfully');
      } else {
        await updateFile({
          fileId: itemToRename.id as Id<'mediaLibrary'>,
          filename: renameForm.name.trim(),
        });
        toast.success('File renamed successfully');
      }
      setShowRenameModal(false);
      setItemToRename(null);
      setRenameForm({ name: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to rename');
    }
  };

  // Toggle options menu
  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // Close menu
  const closeMenu = () => {
    setOpenMenuId(null);
  };

  // Handle menu option click
  const handleMenuAction = (action: string, item: any) => {
    closeMenu();
    switch (action) {
      case 'rename':
        handleRename(item);
        break;
      case 'share':
        openShareModal(item, 'file' in item ? 'file' : 'folder');
        break;
      case 'download':
        handleDownloadFile(item);
        break;
      case 'move':
        setItemToMove({ id: item._id, type: 'file' in item ? 'file' : 'folder', name: item.name || item.filename });
        setShowMoveModal(true);
        break;
      case 'delete':
        if (item.name) {
          handleDeleteFolder(item);
        } else {
          handleDeleteFile(item);
        }
        break;
    }
  };

  // Handle move item
  const handleMove = async () => {
    if (!itemToMove || !selectedMoveFolder) return;

    try {
      if (itemToMove.type === 'folder') {
        await moveFolder({
          folderId: itemToMove.id as Id<'mediaFolders'>,
          newParentId: selectedMoveFolder === 'root' ? undefined : (selectedMoveFolder as Id<'mediaFolders'>),
        });
        toast.success('Folder moved successfully');
      } else {
        await moveFile({
          fileId: itemToMove.id as Id<'mediaLibrary'>,
          folderId: selectedMoveFolder === 'root' ? undefined : (selectedMoveFolder as Id<'mediaFolders'>),
        });
        toast.success('File moved successfully');
      }
      setShowMoveModal(false);
      setItemToMove(null);
      setSelectedMoveFolder(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to move');
    }
  };



  // Handle download file
  const handleDownloadFile = async (file: any) => {
    try {
      const response = await fetch(file.url);
      if (!response.ok) throw new Error('Failed to download file');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('File downloaded successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to download file');
    }
  };

  // Handle file upload with real API
  const handleFileUpload = async () => {
    if (!uploadFile || !currentCompanyId) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('companyId', currentCompanyId);
      if (currentFolderId) {
        formData.append('folderId', currentFolderId);
      }

      const response = await fetch('/api/file-manager/upload', {
        method: 'POST',
        headers: {
          'x-session-token': (user as any)?.sessionToken || '',
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      toast.success(result.message || 'File uploaded successfully');
      setShowUploadModal(false);
      setUploadFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle delete file
  const handleDeleteFile = (file: any) => {
    setItemToDelete({ id: file._id, type: 'file', name: file.filename });
    setShowDeleteModal(true);
  };

  // Handle share
  const handleShare = async () => {
    if (shareForm.selectedUsers.size === 0) {
      toast.error('Please select at least one user to share with');
      return;
    }

    setIsSharing(true);
    try {
      const userIds = Array.from(shareForm.selectedUsers) as Id<'users'>[];

      if (selectedFile) {
        await shareFileWithNotification({
          fileId: selectedFile._id,
          userIds,
          permission: shareForm.permission,
          sendEmailNotification: shareForm.sendEmail,
          shareMessage: shareForm.message,
          domain: domain || 'localhost',
          sharerName: `${user?.firstName} ${user?.lastName}`,
          sharerEmail: user?.email || '',
        });
      } else if (selectedFolder) {
        await shareFolderWithNotification({
          folderId: selectedFolder._id,
          userIds,
          permission: shareForm.permission,
          sendEmailNotification: shareForm.sendEmail,
          shareMessage: shareForm.message,
          domain: domain || 'localhost',
          sharerName: `${user?.firstName} ${user?.lastName}`,
          sharerEmail: user?.email || '',
        });
      }

      toast.success('Shared successfully');
      setShowShareModal(false);
      setShareForm({
        selectedUsers: new Set(),
        permission: 'view',
        sendEmail: false,
        message: '',
      });
      setSelectedFile(null);
      setSelectedFolder(null);
    } catch (error) {
      console.error('Share error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to share');
    } finally {
      setIsSharing(false);
    }
  };

  // Open share modal
  const openShareModal = (item: any, type: 'file' | 'folder') => {
    if (type === 'file') {
      setSelectedFile(item);
      setSelectedFolder(null);
    } else {
      setSelectedFolder(item);
      setSelectedFile(null);
    }
    setShowShareModal(true);
  };

  // Handle selection
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(shareForm.selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setShareForm({ ...shareForm, selectedUsers: newSelection });
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;

    try {
      const fileIds = Array.from(selectedItems).filter((id) =>
        currentFiles.some((f) => f._id === id)
      ) as Id<'mediaLibrary'>[];

      if (fileIds.length > 0) {
        await batchDeleteFiles({ fileIds });
        toast.success(`${fileIds.length} file(s) deleted successfully`);
      }
      setSelectedItems(new Set());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete files');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Get current company
  const currentCompany = companies?.find(c => c?._id === currentCompanyId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Top Row: Nav Menu and Actions */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              {currentCompany && (
                <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
              )}
              <h1 className="text-xl font-semibold text-slate-900">File Manager</h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateFolderModal(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium text-sm"
              >
                <FolderPlus className="h-4 w-4" />
                <span>New Folder</span>
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-medium text-sm"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </button>
            </div>
          </div>

          {/* Search and Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search files and folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Company Selector */}
              {companies && companies.length > 1 && (
                <select
                  value={currentCompanyId || ''}
                  onChange={(e) => setCurrentCompanyId(e.target.value)}
                  className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                >
                  {companies.map((company) => company ? (
                    <option key={company._id} value={company._id}>
                      {company.name}
                    </option>
                  ) : null)}
                </select>
              )}

              {/* View Toggle */}
              <div className="flex items-center bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Breadcrumb Row - Below Search */}
          {(folderPath.length > 0 || currentCompany) && (
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
              <button
                onClick={() => handleBreadcrumbClick(-1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all whitespace-nowrap"
              >
                <Home className="h-4 w-4" />
                <span>My Files</span>
              </button>
              {folderPath.map((folder, index) => (
                <div key={folder.id} className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <button
                    onClick={() => handleBreadcrumbClick(index)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all whitespace-nowrap"
                  >
                    {folder.name}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Storage Stats */}
          {storageStats && (
            <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
              <span>{storageStats.totalFiles} files</span>
              <span>•</span>
              <span>{storageStats.totalFolders} folders</span>
              <span>•</span>
              <span>{formatFileSize(storageStats.totalSize)} used</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile Add Folder Button */}
        <button
          onClick={() => setShowCreateFolderModal(true)}
          className="sm:hidden fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all z-20"
        >
          <FolderPlus className="h-6 w-6" />
        </button>

        {/* Selection Actions */}
        {selectedItems.size > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedItems.size} item(s) selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-medium"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-all text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredSubfolders.length === 0 && filteredFiles.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchQuery ? 'No results found' : 'No files or folders yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search criteria'
                : 'Create a folder or upload files to get started'}
            </p>
            {!searchQuery && (
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowCreateFolderModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium"
                >
                  <FolderPlus className="h-5 w-5" />
                  <span>Create Folder</span>
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-medium"
                >
                  <Upload className="h-5 w-5" />
                  <span>Upload Files</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Combined Folders and Files Grid */}
        {(filteredSubfolders.length > 0 || filteredFiles.length > 0) && (
          <div>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {/* Folders - Blue border */}
                {filteredSubfolders.map((folder) => (
                  <div
                    key={`folder-${folder._id}`}
                    className={`group relative bg-white rounded-xl overflow-hidden transition-all ${
                      selectedItems.has(folder._id)
                        ? 'border-2 border-blue-700 bg-blue-50'
                        : 'border-2 border-blue-500 hover:border-blue-600 hover:shadow-md'
                    }`}
                  >
                    {/* Folder tab */}
                    <div className={`absolute top-0 left-3 right-3 h-2 rounded-t-sm bg-gradient-to-br ${folder.color || 'from-blue-500 to-blue-600'} opacity-80`}></div>

                    <div className="p-3 pt-4" onClick={() => handleFolderClick(folder)}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-900 truncate text-sm">{folder.name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {folder.itemCount || 0} items
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelection(folder._id);
                            }}
                            className={`p-1.5 rounded-lg transition-all ${
                              selectedItems.has(folder._id)
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                            title="Select"
                          >
                            {selectedItems.has(folder._id) ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <div className="h-4 w-4 rounded border-2 border-slate-300" />
                            )}
                          </button>
                          <div className="relative">
                            <button
                              onClick={(e) => toggleMenu(e, `folder-${folder._id}`)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                              title="Options"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {/* Popup Menu */}
                            {openMenuId === `folder-${folder._id}` && (
                              <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[140px]">
                                <button
                                  onClick={() => handleMenuAction('rename', folder)}
                                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Edit className="h-4 w-4 text-purple-600" />
                                  Rename
                                </button>
                                <button
                                  onClick={() => handleMenuAction('move', folder)}
                                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <FolderOpen className="h-4 w-4 text-orange-600" />
                                  Move
                                </button>
                                <button
                                  onClick={() => handleMenuAction('share', folder)}
                                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Share className="h-4 w-4 text-blue-600" />
                                  Share
                                </button>
                                <button
                                  onClick={() => handleMenuAction('delete', folder)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Files - Green border, Images show preview */}
                {filteredFiles.map((file) => {
                  const isImage = file.fileType === 'image';

                  if (isImage) {
                    // Image file - show the actual image
                    return (
                      <div
                        key={`file-${file._id}`}
                        className={`group relative bg-white rounded-xl overflow-hidden border-2 transition-all ${
                          selectedItems.has(file._id)
                            ? 'border-green-700 ring-2 ring-green-200'
                            : 'border-green-500 hover:border-green-600 hover:shadow-md'
                        }`}
                      >
                        {/* Image preview */}
                        <div className="aspect-square relative overflow-hidden bg-slate-100">
                          <img
                            src={file.url}
                            alt={file.filename}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {/* Action buttons overlay - always visible */}
                          <div className="absolute top-2 right-2 flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleSelection(file._id); }}
                              className={`p-1.5 rounded-lg transition-all ${
                                selectedItems.has(file._id)
                                  ? 'bg-green-600 text-white'
                                  : 'bg-white/90 text-slate-700 hover:bg-white'
                              }`}
                              title="Select"
                            >
                              {selectedItems.has(file._id) ? <Check className="h-4 w-4" /> : <div className="h-4 w-4 rounded border-2 border-slate-400" />}
                            </button>
                            <div className="relative">
                              <button
                                onClick={(e) => toggleMenu(e, `file-${file._id}`)}
                                className="p-1.5 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 rounded-lg transition-all"
                                title="Options"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                              {/* Popup Menu */}
                              {openMenuId === `file-${file._id}` && (
                                <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[140px]">
                                  <button
                                    onClick={() => handleMenuAction('rename', file)}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Edit className="h-4 w-4 text-purple-600" />
                                    Rename
                                  </button>
                                  <button
                                    onClick={() => handleMenuAction('move', file)}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <FolderOpen className="h-4 w-4 text-orange-600" />
                                    Move
                                  </button>
                                  <button
                                    onClick={() => handleMenuAction('share', file)}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Share className="h-4 w-4 text-blue-600" />
                                    Share
                                  </button>
                                  <button
                                    onClick={() => handleMenuAction('download', file)}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Download className="h-4 w-4 text-emerald-600" />
                                    Download
                                  </button>
                                  <button
                                    onClick={() => handleMenuAction('delete', file)}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* File info overlay at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6 pointer-events-none">
                          <h3 className="font-medium text-white truncate text-xs">{file.filename}</h3>
                          <p className="text-[10px] text-white/80">
                            {formatFileSize(file.fileSize)}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  // Non-image file - show card with green border
                  return (
                    <div
                      key={`file-${file._id}`}
                      className={`group bg-white rounded-xl p-3 border-2 transition-all ${
                        selectedItems.has(file._id)
                          ? 'border-green-700 bg-green-50'
                          : 'border-green-500 hover:border-green-600 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-900 truncate text-sm">{file.filename}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {file.fileType?.toUpperCase()?.slice(0, 4) || 'FILE'} • {formatFileSize(file.fileSize)}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleSelection(file._id); }}
                            className={`p-1.5 rounded-lg transition-all ${
                              selectedItems.has(file._id)
                                ? 'bg-green-600 text-white'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                            title="Select"
                          >
                            {selectedItems.has(file._id) ? <Check className="h-4 w-4" /> : <div className="h-4 w-4 rounded border-2 border-slate-300" />}
                          </button>
                          <div className="relative">
                            <button
                              onClick={(e) => toggleMenu(e, `file-${file._id}`)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                              title="Options"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {/* Popup Menu */}
                            {openMenuId === `file-${file._id}` && (
                              <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[140px]">
                                <button
                                  onClick={() => handleMenuAction('rename', file)}
                                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Edit className="h-4 w-4 text-purple-600" />
                                  Rename
                                </button>
                                <button
                                  onClick={() => handleMenuAction('move', file)}
                                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <FolderOpen className="h-4 w-4 text-orange-600" />
                                  Move
                                </button>
                                <button
                                  onClick={() => handleMenuAction('share', file)}
                                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Share className="h-4 w-4 text-blue-600" />
                                  Share
                                </button>
                                <button
                                  onClick={() => handleMenuAction('download', file)}
                                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Download className="h-4 w-4 text-emerald-600" />
                                  Download
                                </button>
                                <button
                                  onClick={() => handleMenuAction('delete', file)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // List View
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.size === filteredSubfolders.length + filteredFiles.length && (filteredSubfolders.length + filteredFiles.length) > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const allIds = [...filteredSubfolders.map(f => f._id), ...filteredFiles.map(f => f._id)];
                              setSelectedItems(new Set(allIds));
                            } else {
                              setSelectedItems(new Set());
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Size</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {/* Folders in list view */}
                    {filteredSubfolders.map((folder) => (
                      <tr
                        key={`folder-list-${folder._id}`}
                        className={`hover:bg-slate-50 transition-colors ${
                          selectedItems.has(folder._id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(folder._id)}
                            onChange={() => toggleSelection(folder._id)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div
                            onClick={() => handleFolderClick(folder)}
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${folder.color || 'from-blue-500 to-blue-600'} flex-shrink-0`}>
                              <FolderOpen className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-medium text-slate-900 truncate text-sm">{folder.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600 hidden sm:table-cell">
                          Folder
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 hidden sm:table-cell">
                          {folder.itemCount || 0} items
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openShareModal(folder, 'folder')}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Share"
                            >
                              <Share className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFolder(folder)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Files in list view */}
                    {filteredFiles.map((file) => (
                      <tr
                        key={`file-list-${file._id}`}
                        className={`hover:bg-slate-50 transition-colors ${
                          selectedItems.has(file._id) ? 'bg-green-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(file._id)}
                            onChange={() => toggleSelection(file._id)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-900 truncate text-sm">{file.filename}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-green-600 hidden sm:table-cell capitalize">
                          {file.fileType || 'File'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 hidden sm:table-cell">
                          {formatFileSize(file.fileSize)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleDownloadFile(file)}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openShareModal(file, 'file')}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Share"
                            >
                              <Share className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFile(file)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">Create New Folder</h3>
              <p className="text-sm text-white/70">Organize your files</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Folder Name</label>
                <input
                  type="text"
                  value={createFolderForm.name}
                  onChange={(e) => setCreateFolderForm({ ...createFolderForm, name: e.target.value })}
                  placeholder="My Folder"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  value={createFolderForm.description}
                  onChange={(e) => setCreateFolderForm({ ...createFolderForm, description: e.target.value })}
                  placeholder="Folder description..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                <div className="flex items-center gap-2">
                  {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setCreateFolderForm({ ...createFolderForm, color })}
                      className={`w-8 h-8 rounded-full transition-all ${
                        createFolderForm.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateFolderModal(false);
                    setCreateFolderForm({ name: '', color: '#3b82f6', description: '' });
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={!createFolderForm.name.trim()}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Folder Modal */}
      {showEditFolderModal && selectedFolder && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">Edit Folder</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Folder Name</label>
                <input
                  type="text"
                  value={editFolderForm.name}
                  onChange={(e) => setEditFolderForm({ ...editFolderForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={editFolderForm.description}
                  onChange={(e) => setEditFolderForm({ ...editFolderForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                <div className="flex items-center gap-2">
                  {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditFolderForm({ ...editFolderForm, color })}
                      className={`w-8 h-8 rounded-full transition-all ${
                        editFolderForm.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditFolderModal(false);
                    setSelectedFolder(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditFolder}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">Upload Files</h3>
              <p className="text-sm text-white/70">Add files to your library</p>
            </div>
            <div className="p-6">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-emerald-500 transition-colors">
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-sm text-slate-600 mb-2">
                    {uploadFile ? uploadFile.name : 'Click to select a file'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Images, documents, videos, and more
                  </p>
                </label>
              </div>
              {uploadFile && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-emerald-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{uploadFile.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(uploadFile.size)}</p>
                    </div>
                    <button
                      onClick={() => setUploadFile(null)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={!uploadFile || isUploading}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Upload</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-br from-violet-500 to-violet-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Share className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Share {selectedFile ? 'File' : 'Folder'}</h3>
                  <p className="text-sm text-white/70">
                    {selectedFile ? selectedFile.filename : selectedFolder?.name}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* User Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Users className="h-4 w-4 inline mr-1" />
                  Select Users
                </label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {companyUsers && companyUsers.length > 0 ? (
                    companyUsers
                      .filter((u) => u._id !== user?.id) // Exclude current user
                      .map((u) => (
                        <div
                          key={u._id}
                          onClick={() => toggleUserSelection(u._id)}
                          className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={shareForm.selectedUsers.has(u._id)}
                            onChange={() => toggleUserSelection(u._id)}
                            className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-500">
                      No other users in this company
                    </div>
                  )}
                </div>
                {shareForm.selectedUsers.size > 0 && (
                  <p className="text-xs text-slate-500 mt-2">
                    {shareForm.selectedUsers.size} user(s) selected
                  </p>
                )}
              </div>

              {/* Permission Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Permission Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'view', label: 'View', desc: 'Can only view' },
                    { value: 'edit', label: 'Edit', desc: 'Can edit' },
                    { value: 'read-write', label: 'Full', desc: 'Full access' },
                  ].map((perm) => (
                    <button
                      key={perm.value}
                      onClick={() => setShareForm({ ...shareForm, permission: perm.value as SharePermission })}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        shareForm.permission === perm.value
                          ? 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-slate-200 hover:border-violet-300 text-slate-600'
                      }`}
                    >
                      <p className="text-sm font-medium">{perm.label}</p>
                      <p className="text-xs opacity-70">{perm.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Email Notification */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="send-email"
                    checked={shareForm.sendEmail}
                    onChange={(e) => setShareForm({ ...shareForm, sendEmail: e.target.checked })}
                    className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <label htmlFor="send-email" className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                      <Mail className="h-4 w-4" />
                      Send email notification
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      Notify users via email when they receive access
                    </p>
                  </div>
                </div>
              </div>

              {/* Message (Optional) */}
              {shareForm.sendEmail && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Message (Optional)</label>
                  <textarea
                    value={shareForm.message}
                    onChange={(e) => setShareForm({ ...shareForm, message: e.target.value })}
                    placeholder="Add a message for the recipients..."
                    rows={2}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setShareForm({
                      selectedUsers: new Set(),
                      permission: 'view',
                      sendEmail: false,
                      message: '',
                    });
                    setSelectedFile(null);
                    setSelectedFolder(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShare}
                  disabled={shareForm.selectedUsers.size === 0 || isSharing}
                  className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isSharing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sharing...</span>
                    </>
                  ) : (
                    <>
                      <Share className="h-4 w-4" />
                      <span>Share</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-br from-red-500 to-red-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Delete {itemToDelete.type === 'file' ? 'File' : 'Folder'}</h3>
                  <p className="text-sm text-white/70">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-sm text-slate-700">
                  Are you sure you want to delete <span className="font-semibold text-slate-900">"{itemToDelete.name}"</span>?
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {itemToDelete.type === 'folder'
                    ? 'This will delete the folder and all its contents. This action cannot be undone.'
                    : 'This will permanently delete the file. This action cannot be undone.'}
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setItemToDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && itemToRename && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Edit className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Rename {itemToRename.type === 'file' ? 'File' : 'Folder'}</h3>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Name</label>
                <input
                  type="text"
                  value={renameForm.name}
                  onChange={(e) => setRenameForm({ name: e.target.value })}
                  placeholder={itemToRename.name}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && renameForm.name.trim()) {
                      confirmRename();
                    }
                  }}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowRenameModal(false);
                    setItemToRename(null);
                    setRenameForm({ name: '' });
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRename}
                  disabled={!renameForm.name.trim()}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Rename</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move Modal */}
      {showMoveModal && itemToMove && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[80vh]">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <FolderOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Move to Folder</h3>
                  <p className="text-sm text-white/70">
                    {itemToMove.name}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Destination Folder</label>
                <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl">
                  {/* Root option */}
                  <button
                    onClick={() => setSelectedMoveFolder('root')}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                      selectedMoveFolder === 'root' ? 'bg-orange-50' : ''
                    }`}
                  >
                    <Home className="h-5 w-5 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">Root</span>
                    {selectedMoveFolder === 'root' && <Check className="h-5 w-5 text-orange-600 ml-auto" />}
                  </button>
                  {/* Folders tree */}
                  {folders?.map((folder) => {
                    const isCurrentFolder = folder._id === itemToMove.id;
                    return (
                      <button
                        key={folder._id}
                        onClick={() => !isCurrentFolder && setSelectedMoveFolder(folder._id)}
                        disabled={isCurrentFolder}
                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${
                          selectedMoveFolder === folder._id ? 'bg-orange-50' : ''
                        } ${isCurrentFolder ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <FolderOpen className="h-5 w-5 text-blue-500" />
                        <span className="text-sm font-medium text-slate-700 flex-1">{folder.name}</span>
                        {selectedMoveFolder === folder._id && <Check className="h-5 w-5 text-orange-600 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowMoveModal(false);
                    setItemToMove(null);
                    setSelectedMoveFolder(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMove}
                  disabled={!selectedMoveFolder}
                  className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <FolderOpen className="h-4 w-4" />
                  <span>Move</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Side Sheet */}
      {currentCompany && (
        <NavigationSideSheet
          isOpen={isSideSheetOpen}
          onClose={() => setIsSideSheetOpen(false)}
          companyId={currentCompany._id}
          companyName={currentCompany.name}
          enabledApps={currentCompany?.enabledApps}
        />
      )}

      {/* Toast Notifications - Global Toaster handles this */}

    </div>
  );
}

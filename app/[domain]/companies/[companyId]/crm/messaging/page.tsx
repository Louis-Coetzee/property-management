'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '../../../../AuthProvider';
import { NavigationMenuButton, NavigationSideSheet } from '@/components/navigation/NavigationSideSheet';
import toast from 'react-hot-toast';
import {
  MessageSquare,
  Send,
  Search,
  Users,
  MoreVertical,
  X,
  Loader2,
  User,
  Clock,
  Check,
  CheckCheck,
  Paperclip,
  Plus,
  UserPlus,
  ArrowLeft,
  Group as GroupIcon,
  Info,
  Dot,
  ChevronRight,
  Trash2,
  LogOut,
} from 'lucide-react';
import { Id } from '@/convex/_generated/dataModel';

// Common emojis organized by category
const EMOJI_CATEGORIES = {
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🫢', '🫣', '🤫', '🤔', '🫡', '🤐', '🤨', '😐', '😑', '😶', '🫥', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'],
  gestures: ['👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
  people: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕'],
  food: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫'],
  activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘'],
  objects: ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏰', '⏱️', '⏲️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷'],
  symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♨️', '✴️', '🆚', '📳', '📴', '🅰️', '🆎', '🅱️', '🆑', '🆒', '🆓', 'ℹ️', '🆔', 'Ⓜ️', '🆕', '🆖', '🅾️', '🆗', '🅿️', '🆘', '🆙', '🆚', '🈁', '🈂️', '🈷️', '🈶', '🈯', '🉐', '🈹', '🈚', '🈲', '🉑', '🈸', '🈴', '🈳', '㊗️', '㊙️', '🈺', '🈵'],
};

type Group = {
  _id: Id<'messageGroups'>;
  name: string;
  description?: string;
  memberIds: Id<'users'>[];
  avatarEmoji?: string;
  avatarColor?: string;
  createdById: Id<'users'>;
};

export default function MessagingPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const companyId = params.companyId as string;

  // State
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'groups' | 'direct'>('groups');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mobile-only: view state for showing full screen chat on mobile
  const [mobileChatView, setMobileChatView] = useState(false);

  // Show chat info panel (desktop only)
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  // Time update state for accurate message times
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys');
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUsersForGroup, setSelectedUsersForGroup] = useState<Set<string>>(new Set());
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Edit group modal states
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [editingGroupDescription, setEditingGroupDescription] = useState('');
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);

  // Add members modal states
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<Set<string>>(new Set());
  const [isAddingMembers, setIsAddingMembers] = useState(false);

  // Confirmation modal states
  const [showDeleteGroupConfirmation, setShowDeleteGroupConfirmation] = useState(false);
  const [showLeaveGroupConfirmation, setShowLeaveGroupConfirmation] = useState(false);
  const [showRemoveMemberConfirmation, setShowRemoveMemberConfirmation] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  // Query company
  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  // Query groups
  const groups = useQuery(api.messageGroups.getGroupsByCompany, {
    companyId: companyId as Id<'companies'>,
    userId: user?.id as Id<'users'>,
  });

  // Query messages
  const messages = useQuery(api.messages.list,
    (selectedTab === 'groups' && selectedGroupId) || (selectedTab === 'direct' && selectedUserId) ? {
      userId: user?.id as any,
      companyId: companyId as Id<'companies'>,
      groupId: selectedTab === 'groups' && selectedGroupId ? (selectedGroupId as Id<'messageGroups'>) : undefined,
      recipientId: selectedTab === 'direct' && selectedUserId ? (selectedUserId as Id<'users'>) : undefined,
      isDirect: selectedTab === 'direct',
    } : 'skip'
  );

  // Query company team members for direct messages and group creation
  const teamMembersList = useQuery(
    api.teamMembers.listByCompany,
    user?.id && companyId ? {
      userId: user.id as Id<'users'>,
      companyId: companyId as Id<'companies'>,
    } : 'skip'
  );

  // Send message mutation
  const sendMessage = useMutation(api.messages.send);

  // Mark as delivered mutation
  const markAsDelivered = useMutation(api.messages.markAsDelivered);

  // Create group mutation
  const createGroup = useMutation(api.messageGroups.createGroup);

  // Update group mutation
  const updateGroup = useMutation(api.messageGroups.updateGroup);

  // Add group members mutation
  const addGroupMembers = useMutation(api.messageGroups.addGroupMembers);

  // Remove group member mutation
  const removeGroupMember = useMutation(api.messageGroups.removeGroupMember);

  // Delete group mutation
  const deleteGroup = useMutation(api.messageGroups.deleteGroup);

  // Leave group mutation
  const leaveGroup = useMutation(api.messageGroups.leaveGroup);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as delivered and read when conversation changes or when new messages arrive
  useEffect(() => {
    const markAsDeliveredAsync = async () => {
      if (user && (selectedGroupId || selectedUserId)) {
        try {
          await markAsDelivered({
            userId: user.id as any,
            companyId: companyId as Id<'companies'>,
            recipientId: selectedTab === 'direct' && selectedUserId ? (selectedUserId as Id<'users'>) : undefined,
            groupId: selectedTab === 'groups' && selectedGroupId ? (selectedGroupId as Id<'messageGroups'>) : undefined,
          });
        } catch (error) {
          console.error('Failed to mark messages as delivered:', error);
        }
      }
    };

    markAsDeliveredAsync();
  }, [selectedGroupId, selectedUserId, selectedTab, user, companyId, markAsDelivered, messages]);

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Insert emoji into message input
  const insertEmoji = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Handle conversation selection
  const handleSelectConversation = (type: 'group' | 'user', id: string) => {
    if (type === 'group') {
      setSelectedTab('groups');
      setSelectedGroupId(id);
      setSelectedUserId(null);
    } else {
      setSelectedTab('direct');
      setSelectedUserId(id);
      setSelectedGroupId(null);
    }
    // On mobile, switch to full chat view
    setMobileChatView(true);
    setShowInfoPanel(false);
  };

  // Handle back to conversation list (mobile only)
  const handleBackToList = () => {
    setMobileChatView(false);
    setShowInfoPanel(false);
  };

  // Check if mobile view
  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 750;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !user) return;
    if (selectedTab === 'direct' && !selectedUserId) {
      toast.error('Please select a team member to message');
      return;
    }
    if (selectedTab === 'groups' && !selectedGroupId) {
      toast.error('Please select a group to message');
      return;
    }

    try {
      await sendMessage({
        userId: user?.id as any,
        companyId: companyId as Id<'companies'>,
        content: messageInput.trim(),
        messageType: 'text',
        isDirect: selectedTab === 'direct',
        recipientId: selectedTab === 'direct' && selectedUserId ? (selectedUserId as Id<'users'>) : undefined,
        groupId: selectedTab === 'groups' && selectedGroupId ? (selectedGroupId as Id<'messageGroups'>) : undefined,
      });
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    if (selectedUsersForGroup.size === 0) {
      toast.error('Please select at least one member');
      return;
    }

    setIsCreatingGroup(true);
    try {
      const memberIds = Array.from(selectedUsersForGroup) as Id<'users'>[];
      await createGroup({
        companyId: companyId as Id<'companies'>,
        name: groupName,
        description: groupDescription || undefined,
        memberIds,
        createdById: user?.id as Id<'users'>,
        avatarEmoji: '👥',
        avatarColor: '#10b981',
      });
      toast.success('Group created successfully');
      setShowCreateGroupModal(false);
      setGroupName('');
      setGroupDescription('');
      setSelectedUsersForGroup(new Set());
    } catch (error) {
      console.error('Failed to create group:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create group');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleEditGroup = () => {
    if (!selectedGroupId) return;
    const group = groups?.find(g => g._id === selectedGroupId);
    if (group) {
      setEditingGroupName(group.name);
      setEditingGroupDescription(group.description || '');
      setShowEditGroupModal(true);
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroupName.trim() || !selectedGroupId) {
      toast.error('Please enter a group name');
      return;
    }

    setIsUpdatingGroup(true);
    try {
      await updateGroup({
        groupId: selectedGroupId as Id<'messageGroups'>,
        name: editingGroupName,
        description: editingGroupDescription || undefined,
      });
      toast.success('Group updated successfully');
      setShowEditGroupModal(false);
    } catch (error) {
      console.error('Failed to update group:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update group');
    } finally {
      setIsUpdatingGroup(false);
    }
  };

  const handleAddMembers = () => {
    setSelectedUsersToAdd(new Set());
    setShowAddMembersModal(true);
  };

  const handleConfirmAddMembers = async () => {
    if (!selectedGroupId) return;
    if (selectedUsersToAdd.size === 0) {
      toast.error('Please select at least one member');
      return;
    }

    setIsAddingMembers(true);
    try {
      const memberIds = Array.from(selectedUsersToAdd) as Id<'users'>[];
      await addGroupMembers({
        groupId: selectedGroupId as Id<'messageGroups'>,
        memberIds,
      });
      toast.success('Members added successfully');
      setShowAddMembersModal(false);
      setSelectedUsersToAdd(new Set());
    } catch (error) {
      console.error('Failed to add members:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add members');
    } finally {
      setIsAddingMembers(false);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    setMemberToRemove(memberId);
    setShowRemoveMemberConfirmation(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove || !selectedGroupId) return;

    setIsRemovingMember(true);
    try {
      await removeGroupMember({
        groupId: selectedGroupId as Id<'messageGroups'>,
        memberId: memberToRemove as Id<'users'>,
      });
      toast.success('Member removed successfully');
      setShowRemoveMemberConfirmation(false);
      setMemberToRemove(null);
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove member');
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleDeleteGroup = () => {
    setShowDeleteGroupConfirmation(true);
  };

  const handleConfirmDeleteGroup = async () => {
    if (!selectedGroupId) return;

    setIsDeletingGroup(true);
    try {
      await deleteGroup({
        groupId: selectedGroupId as Id<'messageGroups'>,
      });
      toast.success('Group deleted successfully');
      setShowDeleteGroupConfirmation(false);
      setShowInfoPanel(false);
      setSelectedGroupId(null);
    } catch (error) {
      console.error('Failed to delete group:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete group');
    } finally {
      setIsDeletingGroup(false);
    }
  };

  const handleLeaveGroup = () => {
    setShowLeaveGroupConfirmation(true);
  };

  const handleConfirmLeaveGroup = async () => {
    if (!selectedGroupId || !user?.id) return;

    setIsLeavingGroup(true);
    try {
      await leaveGroup({
        groupId: selectedGroupId as Id<'messageGroups'>,
        userId: user.id as Id<'users'>,
      });
      toast.success('Left group successfully');
      setShowLeaveGroupConfirmation(false);
      setShowInfoPanel(false);
      setSelectedGroupId(null);
    } catch (error) {
      console.error('Failed to leave group:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to leave group');
    } finally {
      setIsLeavingGroup(false);
    }
  };

  const getConversationName = () => {
    if (selectedTab === 'groups') {
      const group = groups?.find(g => g._id === selectedGroupId);
      return group?.name || 'Select a group';
    }
    const member = teamMembersList?.find(m => m.userId === selectedUserId);
    return member?.userName || 'Select a conversation';
  };

  const getConversationDescription = () => {
    if (selectedTab === 'groups') {
      const group = groups?.find(g => g._id === selectedGroupId);
      if (group) {
        const memberCount = group.memberIds.length;
        return `${memberCount} member${memberCount !== 1 ? 's' : ''}`;
      }
      return '';
    }
    const member = teamMembersList?.find(m => m.userId === selectedUserId);
    return member?.userEmail || '';
  };

  const getGroupAvatar = () => {
    const group = groups?.find(g => g._id === selectedGroupId);
    return group?.avatarEmoji || '👥';
  };

  const getGroupMembers = () => {
    if (selectedTab !== 'groups' || !selectedGroupId) return [];
    const group = groups?.find(g => g._id === selectedGroupId);
    if (!group) return [];
    return teamMembersList?.filter(u => group.memberIds.includes(u.userId)) || [];
  };

  const formatTime = (timestamp: number) => {
    const now = currentTime;
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getMessageStatus = (message: any) => {
    if (message.senderId !== user?.id) return null;

    const deliveredTo = message.deliveredTo || [];
    const readBy = message.readBy || [];

    // Determine who the recipient(s) are
    let recipientIds: string[] = [];
    if (message.isDirect && message.recipientId) {
      recipientIds = [message.recipientId];
    } else if (!message.isDirect && message.groupId) {
      // For group messages, get group members excluding sender
      const group = groups?.find(g => g._id === message.groupId);
      if (group) {
        recipientIds = group.memberIds.filter((id: string) => id !== message.senderId);
      }
    }

    // Check if all recipients have read the message
    const allRecipientsRead = recipientIds.length > 0 &&
      recipientIds.every((id: string) => readBy.includes(id));

    // Check if at least one recipient has received the message
    const anyRecipientDelivered = recipientIds.length > 0 &&
      recipientIds.some((id: string) => deliveredTo.includes(id));

    // Read by all recipients - 2 green ticks
    if (allRecipientsRead) {
      return <CheckCheck className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} />;
    }

    // Delivered to at least one recipient - 2 grey ticks
    if (anyRecipientDelivered) {
      return <CheckCheck className="h-3.5 w-3.5 text-slate-400" strokeWidth={2.5} />;
    }

    // Sent but not yet delivered - 1 grey tick
    return <Check className="h-3.5 w-3.5 text-slate-400" strokeWidth={2.5} />;
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsersForGroup);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsersForGroup(newSelection);
  };

  // Check if a conversation is selected
  const hasConversationSelected = selectedTab === 'groups' ? selectedGroupId : selectedUserId;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const filteredUsers = teamMembersList?.filter(m => m.userId !== user?.id).filter(m =>
    m.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // ==================== MAIN SPLIT LAYOUT ====================
  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      {/* LEFT SIDEBAR - Conversation List (30% on desktop, full on mobile when not in chat) */}
      <div className={`${
        mobileChatView ? 'hidden md:flex' : 'flex'
      } w-full md:w-[30%] min-w-[280px] max-w-[400px] flex-col bg-slate-50 border-r border-slate-200`}>
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between shadow-sm flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">Messages</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Team communication</p>
            </div>
          </div>
          <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
        </div>

        {/* Search Bar */}
        <div className="bg-white px-3 sm:px-4 py-3 border-b border-slate-100 flex-shrink-0">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white flex border-b border-slate-200 flex-shrink-0">
          <button
            onClick={() => {
              setSelectedTab('groups');
              setSelectedGroupId(null);
              setSelectedUserId(null);
            }}
            className={`flex-1 py-3 px-2 sm:px-4 text-sm font-semibold transition-all border-b-2 ${
              selectedTab === 'groups'
                ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            <GroupIcon className="h-4 w-4 inline mr-1" />
            <span className="hidden sm:inline">Groups</span>
            {groups && groups.length > 0 && (
              <span className="ml-1 sm:ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                {groups.length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setSelectedTab('direct');
              setSelectedGroupId(null);
              setSelectedUserId(null);
            }}
            className={`flex-1 py-3 px-2 sm:px-4 text-sm font-semibold transition-all border-b-2 ${
              selectedTab === 'direct'
                ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            <Users className="h-4 w-4 inline mr-1" />
            <span className="hidden sm:inline">Direct</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {selectedTab === 'groups' ? (
            <div className="p-3 sm:p-4 space-y-2">
              {/* Create Group Button */}
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="w-full flex items-center gap-3 p-3 sm:p-4 rounded-2xl transition-all hover:bg-blue-50 border-2 border-dashed border-slate-200 hover:border-blue-300 group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-slate-100 group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-600 transition-all flex-shrink-0">
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-semibold text-slate-700 group-hover:text-blue-700 text-sm sm:text-base">Create New Group</p>
                  <p className="text-xs text-slate-500 hidden sm:block">Start a group conversation</p>
                </div>
              </button>

              {/* Groups List */}
              {groups && groups.length > 0 ? (
                groups.map((group) => {
                  const memberCount = group.memberIds.length;
                  const isSelected = selectedGroupId === group._id;
                  return (
                    <button
                      key={group._id}
                      onClick={() => handleSelectConversation('group', group._id)}
                      className={`w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl transition-all border ${
                        isSelected
                          ? 'bg-blue-50 border-blue-300 shadow-sm'
                          : 'bg-white border-slate-100 hover:bg-white hover:shadow-md'
                      }`}
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-200 flex-shrink-0">
                        {group.avatarEmoji || '👥'}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-bold text-slate-900 truncate text-sm sm:text-base">{group.name}</p>
                        <p className="text-xs sm:text-sm text-slate-500">{memberCount} members</p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-8 sm:p-12 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <GroupIcon className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">No groups yet</h3>
                  <p className="text-xs sm:text-sm text-slate-500">Create a group to start messaging</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 sm:p-4 space-y-2">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((member) => {
                  const isSelected = selectedUserId === member.userId;
                  return (
                    <button
                      key={member.userId}
                      onClick={() => handleSelectConversation('user', member.userId)}
                      className={`w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl transition-all border ${
                        isSelected
                          ? 'bg-blue-50 border-blue-300 shadow-sm'
                          : 'bg-white border-slate-100 hover:bg-white hover:shadow-md'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-200">
                          <User className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border-2 border-white" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-bold text-slate-900 truncate text-sm sm:text-base">{member.userName}</p>
                        <p className="text-xs sm:text-sm text-slate-500 truncate">{member.userEmail}</p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-8 sm:p-12 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">No users found</h3>
                  <p className="text-xs sm:text-sm text-slate-500">Try a different search term</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT AREA - Chat (70% on desktop, full on mobile when in chat) */}
      <div className={`${
        mobileChatView ? 'flex' : 'hidden md:flex'
      } flex-1 flex-col bg-slate-100 overflow-hidden ${
        mobileChatView ? 'fixed inset-0 z-50 h-screen w-screen md:relative md:h-auto md:w-auto' : ''
      }`}>
        {/* Mobile back button header - Fixed at top on mobile */}
        <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-2 flex-shrink-0 z-10 safe-top">
          <button
            onClick={handleBackToList}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg flex-shrink-0">
            {selectedTab === 'groups' ? (
              <span className="text-base">{getGroupAvatar()}</span>
            ) : (
              <Users className="h-4 w-4 text-white" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-slate-900 truncate text-sm">{getConversationName()}</h1>
            <p className="text-xs text-slate-500 truncate">{getConversationDescription()}</p>
          </div>
        </div>

        {/* Chat content area */}
        {(selectedGroupId || selectedUserId) ? (
          <>
            {/* Desktop Header */}
            <div className="hidden md:flex bg-white border-b border-slate-200 px-4 py-3 items-center justify-between shadow-sm flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-200 flex-shrink-0">
                  {selectedTab === 'groups' ? (
                    <span className="text-lg">{getGroupAvatar()}</span>
                  ) : (
                    <Users className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="font-bold text-slate-900 truncate">{getConversationName()}</h1>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Dot className="h-3 w-3 text-emerald-500 fill-emerald-500 flex-shrink-0" />
                    <span className="truncate">{getConversationDescription()}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setShowInfoPanel(!showInfoPanel)}
                  className={`p-2 rounded-xl transition-colors ${
                    showInfoPanel ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Info className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex overflow-hidden min-h-0 h-full">
              <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                {/* Messages */}
                <div className={`flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-1 min-h-0 scroll-smooth ${
                  mobileChatView ? 'pt-[52px] pb-[85px]' : ''
                }`}>
                  {messages && messages.length > 0 ? (
                    messages.map((message, index) => {
                      const isOwn = message.senderId === user?.id;
                      const showAvatar = index === 0 || messages[index - 1]?.senderId !== message.senderId;
                      const isConsecutive = !showAvatar;

                      return (
                        <div
                          key={message._id}
                          className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''} w-full`}
                        >
                          {showAvatar && (
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                              isOwn
                                ? 'bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-300'
                                : 'bg-gradient-to-br from-slate-200 to-slate-300'
                            }`}>
                              <User className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isOwn ? 'text-blue-600' : 'text-white'}`} />
                            </div>
                          )}
                          {!showAvatar && <div className="w-7 sm:w-8 flex-shrink-0" />}
                          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} min-w-0 max-w-[calc(100%-3rem)] sm:max-w-[70%]`}>
                            {showAvatar && (
                              <div className={`flex items-center gap-1.5 sm:gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''} w-full`}>
                                <span className="text-xs font-semibold text-slate-900 truncate">{message.senderName || 'User'}</span>
                                <span className="text-xs text-slate-400 flex-shrink-0">{formatTime(message.createdAt)}</span>
                              </div>
                            )}
                            <div className={`relative`}>
                              <div className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl ${
                                isOwn
                                  ? 'bg-gradient-to-br from-blue-50 to-blue-100 text-slate-900 border border-blue-200'
                                  : 'bg-white border border-slate-200 text-slate-900 shadow-sm'
                              }`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">{message.content}</p>
                              </div>
                              {isConsecutive ? (
                                <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                  <span className="text-[10px] text-slate-400 flex-shrink-0">{formatMessageTime(message.createdAt)}</span>
                                  {getMessageStatus(message)}
                                </div>
                              ) : isOwn ? (
                                <div className="flex items-center gap-1 mt-1 justify-end">
                                  <span className="text-[10px] text-slate-400 flex-shrink-0">{formatMessageTime(message.createdAt)}</span>
                                  {getMessageStatus(message)}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                        selectedTab === 'groups'
                          ? 'bg-gradient-to-br from-blue-100 to-blue-200'
                          : 'bg-gradient-to-br from-slate-100 to-slate-200'
                      }`}>
                        {selectedTab === 'groups' ? (
                          <GroupIcon className="h-8 w-8 text-blue-600" />
                        ) : (
                          <MessageSquare className="h-8 w-8 text-slate-500" />
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">No messages yet</h3>
                      <p className="text-sm text-slate-500">
                        {selectedTab === 'groups'
                          ? 'Be the first to message this group'
                          : 'Start the conversation'}
                      </p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                {/* Mobile fixed input - only shows on mobile when in chat view */}
                {mobileChatView && (
                  <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-200 p-3 pb-6 safe-bottom">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                      <button
                        type="button"
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0"
                      >
                        <Paperclip className="h-4 w-4" />
                      </button>
                      <div className="flex-1 relative min-w-0">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder="Type a message..."
                          className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                      <div className="relative" ref={emojiPickerRef}>
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0"
                        >
                          <span className="text-xl">😊</span>
                        </button>

                        {/* Emoji Picker */}
                        {showEmojiPicker && (
                          <div className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[50vh]">
                            {/* Category Tabs */}
                            <div className="flex border-b border-slate-200 overflow-x-auto">
                              <button
                                type="button"
                                onClick={() => setSelectedEmojiCategory('smileys')}
                                className={`flex-1 px-3 py-2 text-lg hover:bg-slate-50 transition-colors whitespace-nowrap ${
                                  selectedEmojiCategory === 'smileys' ? 'bg-blue-50 border-b-2 border-blue-500' : ''
                                }`}
                              >
                                😀
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedEmojiCategory('gestures')}
                                className={`flex-1 px-3 py-2 text-lg hover:bg-slate-50 transition-colors whitespace-nowrap ${
                                  selectedEmojiCategory === 'gestures' ? 'bg-blue-50 border-b-2 border-blue-500' : ''
                                }`}
                              >
                                👋
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedEmojiCategory('hearts')}
                                className={`flex-1 px-3 py-2 text-lg hover:bg-slate-50 transition-colors whitespace-nowrap ${
                                  selectedEmojiCategory === 'hearts' ? 'bg-blue-50 border-b-2 border-blue-500' : ''
                                }`}
                              >
                                ❤️
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedEmojiCategory('people')}
                                className={`flex-1 px-3 py-2 text-lg hover:bg-slate-50 transition-colors whitespace-nowrap ${
                                  selectedEmojiCategory === 'people' ? 'bg-blue-50 border-b-2 border-blue-500' : ''
                                }`}
                              >
                                🙌
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedEmojiCategory('animals')}
                                className={`flex-1 px-3 py-2 text-lg hover:bg-slate-50 transition-colors whitespace-nowrap ${
                                  selectedEmojiCategory === 'animals' ? 'bg-blue-50 border-b-2 border-blue-500' : ''
                                }`}
                              >
                                🐶
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedEmojiCategory('food')}
                                className={`flex-1 px-3 py-2 text-lg hover:bg-slate-50 transition-colors whitespace-nowrap ${
                                  selectedEmojiCategory === 'food' ? 'bg-blue-50 border-b-2 border-blue-500' : ''
                                }`}
                              >
                                🍕
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedEmojiCategory('activities')}
                                className={`flex-1 px-3 py-2 text-lg hover:bg-slate-50 transition-colors whitespace-nowrap ${
                                  selectedEmojiCategory === 'activities' ? 'bg-blue-50 border-b-2 border-blue-500' : ''
                                }`}
                              >
                                ⚽
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedEmojiCategory('objects')}
                                className={`flex-1 px-3 py-2 text-lg hover:bg-slate-50 transition-colors whitespace-nowrap ${
                                  selectedEmojiCategory === 'objects' ? 'bg-blue-50 border-b-2 border-blue-500' : ''
                                }`}
                              >
                                💡
                              </button>
                            </div>

                            {/* Emoji Grid */}
                            <div className="p-3 max-h-64 overflow-y-auto">
                              <div className="grid grid-cols-8 gap-1">
                                {EMOJI_CATEGORIES[selectedEmojiCategory].map((emoji, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => insertEmoji(emoji)}
                                    className="p-2 text-2xl hover:bg-slate-100 rounded-lg transition-colors"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={!messageInput.trim()}
                        className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex-shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                )}

                {/* Desktop regular input - only shows on desktop (md+ screens) */}
                <form onSubmit={handleSendMessage} className="hidden md:flex bg-white border-t border-slate-200 p-3 sm:p-4 flex-shrink-0 relative items-center gap-2 w-full">
                    <button
                      type="button"
                      className="p-2 sm:p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0"
                    >
                      <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <div className="flex-1 relative min-w-0">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-100 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                    <div className="relative" ref={emojiPickerRef}>
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2 sm:p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0"
                      >
                        <span className="text-xl sm:text-2xl">😊</span>
                      </button>

                      {/* Emoji Picker */}
                      {showEmojiPicker && (
                        <div className={`absolute bottom-full right-0 mb-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden ${
                          mobileChatView ? 'max-h-[50vh]' : ''
                        }`}>
                          {/* Category Tabs */}
                          <div className="flex border-b border-slate-200 overflow-x-auto">
                            <button
                              type="button"
                              onClick={() => setSelectedEmojiCategory('smileys')}
                              className={`flex-1 px-3 py-2 text-lg hover:bg-slate-50 transition-colors whitespace-nowrap ${
                                selectedEmojiCategory === 'smileys' ? 'bg-blue-50 border-b-2 border-blue-500' : ''
                              }`}
                            >
                              😀
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedEmojiCategory('gestures')}
                              className={`flex-1 px-3 py-2 text-lg hover:bg-slate-50 transition-colors whitespace-nowrap ${
                                selectedEmojiCategory === 'gestures' ? 'bg-blue-50 border-b-2 border-blue-500' : ''
                              }`}
                            >
                              👋
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedEmojiCategory('hearts')}
                              className={`flex-1 px-3 py-2 text-lg hover:bg-slate-50 transition-colors whitespace-nowrap ${
                                selectedEmojiCategory === 'hearts' ? 'bg-blue-50 border-b-2 border-blue-500' : ''
                              }`}
                            >
                              ❤️
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedEmojiCategory('people')}
                              className={`flex-1 px-3 py-2 text-lg hover:bg-slate-50 transition-colors whitespace-nowrap ${
                                selectedEmojiCategory === 'people' ? 'bg-blue-50 border-b-2 border-blue-500' : ''
                              }`}
                            >
                              🙌
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedEmojiCategory('animals')}
                              className={`flex-1 px-3 py-2 text-lg hover:bg-slate-50 transition-colors whitespace-nowrap ${
                                selectedEmojiCategory === 'animals' ? 'bg-blue-50 border-b-2 border-blue-500' : ''
                              }`}
                            >
                              🐶
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedEmojiCategory('food')}
                              className={`flex-1 px-3 py-2 text-lg hover:bg-slate-50 transition-colors whitespace-nowrap ${
                                selectedEmojiCategory === 'food' ? 'bg-blue-50 border-b-2 border-blue-500' : ''
                              }`}
                            >
                              🍕
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedEmojiCategory('activities')}
                              className={`flex-1 px-3 py-2 text-lg hover:bg-slate-50 transition-colors whitespace-nowrap ${
                                selectedEmojiCategory === 'activities' ? 'bg-blue-50 border-b-2 border-blue-500' : ''
                              }`}
                            >
                              ⚽
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedEmojiCategory('objects')}
                              className={`flex-1 px-3 py-2 text-lg hover:bg-slate-50 transition-colors whitespace-nowrap ${
                                selectedEmojiCategory === 'objects' ? 'bg-blue-50 border-b-2 border-blue-500' : ''
                              }`}
                            >
                              💡
                            </button>
                          </div>

                          {/* Emoji Grid */}
                          <div className="p-3 max-h-64 overflow-y-auto">
                            <div className="grid grid-cols-8 gap-1">
                              {EMOJI_CATEGORIES[selectedEmojiCategory].map((emoji, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => insertEmoji(emoji)}
                                  className="p-2 text-2xl hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="p-2.5 sm:p-3 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex-shrink-0"
                    >
                      <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                </form>
              </div>

              {/* Info Panel - Desktop only */}
              {showInfoPanel && (
                <div className="hidden md:block w-80 bg-white border-l border-slate-200 overflow-y-auto flex-shrink-0 flex flex-col">
                  {selectedTab === 'groups' ? (
                    <>
                      <div className="p-4 border-b border-slate-100">
                        <div className="flex items-center justify-center mb-4">
                          <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
                            <span className="text-4xl">{getGroupAvatar()}</span>
                          </div>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 text-center">{getConversationName()}</h2>
                        <p className="text-sm text-slate-500 text-center">{getConversationDescription()}</p>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={handleEditGroup}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={handleAddMembers}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Members</h3>
                        <div className="space-y-2">
                          {getGroupMembers().map((member) => {
                            const isCurrentUser = member.userId === user?.id;
                            const group = groups?.find(g => g._id === selectedGroupId);
                            const isCreator = group?.createdById === member.userId;
                            return (
                              <div key={member.userId} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 group">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                  <User className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 truncate">
                                    {member.userName}
                                    {isCreator && <span className="ml-1 text-xs text-blue-600">(Admin)</span>}
                                  </p>
                                  <p className="text-xs text-slate-500 truncate">{member.userEmail}</p>
                                </div>
                                {!isCurrentUser && !isCreator && (
                                  <button
                                    onClick={() => handleRemoveMember(member.userId)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-auto p-4 border-t border-slate-100 space-y-2">
                        <button
                          onClick={handleLeaveGroup}
                          className="w-full flex items-center justify-center gap-2 p-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          <span className="text-sm font-medium">Leave Group</span>
                        </button>
                        <button
                          onClick={handleDeleteGroup}
                          className="w-full flex items-center justify-center gap-2 p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="text-sm font-medium">Delete Group</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-slate-900 mb-3">Contact Information</h3>
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <p className="text-xs text-slate-500 mb-1">Email</p>
                          <p className="text-sm font-medium text-slate-900 break-all">{getConversationDescription()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          // Empty state when no conversation selected (desktop only)
          <div className="hidden md:flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <MessageSquare className="h-12 w-12 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Select a conversation</h2>
            <p className="text-slate-500">Choose a group or direct message to start chatting</p>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <UserPlus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Create New Group</h3>
                    <p className="text-sm text-white/70">Start a group conversation</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateGroupModal(false)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Sales Team"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description (Optional)</label>
                <input
                  type="text"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="What's this group about?"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Select Members ({selectedUsersForGroup.size} selected)
                </label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {teamMembersList?.filter(m => m.userId !== user?.id).map((member) => (
                    <div
                      key={member.userId}
                      onClick={() => toggleUserSelection(member.userId)}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsersForGroup.has(member.userId)}
                        onChange={() => toggleUserSelection(member.userId)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {member.userName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{member.userEmail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCreateGroupModal(false);
                    setGroupName('');
                    setGroupDescription('');
                    setSelectedUsersForGroup(new Set());
                  }}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || selectedUsersForGroup.size === 0 || isCreatingGroup}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isCreatingGroup ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Create Group</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditGroupModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Edit Group</h3>
                    <p className="text-sm text-white/70">Update group information</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditGroupModal(false)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Group Name</label>
                <input
                  type="text"
                  value={editingGroupName}
                  onChange={(e) => setEditingGroupName(e.target.value)}
                  placeholder="Group name"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description (Optional)</label>
                <input
                  type="text"
                  value={editingGroupDescription}
                  onChange={(e) => setEditingGroupDescription(e.target.value)}
                  placeholder="What's this group about?"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowEditGroupModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateGroup}
                  disabled={!editingGroupName.trim() || isUpdatingGroup}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isUpdatingGroup ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {showAddMembersModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <UserPlus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Add Members</h3>
                    <p className="text-sm text-white/70">Add people to this group</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddMembersModal(false)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Select Members ({selectedUsersToAdd.size} selected)
                </label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {teamMembersList?.filter(m => m.userId !== user?.id && !getGroupMembers().some(gm => gm.userId === m.userId)).map((member) => (
                    <div
                      key={member.userId}
                      onClick={() => {
                        const newSelection = new Set(selectedUsersToAdd);
                        if (newSelection.has(member.userId)) {
                          newSelection.delete(member.userId);
                        } else {
                          newSelection.add(member.userId);
                        }
                        setSelectedUsersToAdd(newSelection);
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsersToAdd.has(member.userId)}
                        onChange={() => {}}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {member.userName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{member.userEmail}</p>
                      </div>
                    </div>
                  ))}
                  {teamMembersList?.filter(m => m.userId !== user?.id && !getGroupMembers().some(gm => gm.userId === m.userId)).length === 0 && (
                    <div className="p-8 text-center text-slate-500 text-sm">
                      No more members to add
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAddMembersModal(false);
                    setSelectedUsersToAdd(new Set());
                  }}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAddMembers}
                  disabled={selectedUsersToAdd.size === 0 || isAddingMembers}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isAddingMembers ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Add Members</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {showRemoveMemberConfirmation && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <X className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Remove Member?</h3>
              <p className="text-sm text-slate-600 mb-6">
                Are you sure you want to remove this member from the group?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRemoveMemberConfirmation(false);
                    setMemberToRemove(null);
                  }}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRemoveMember}
                  disabled={isRemovingMember}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isRemovingMember ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Removing...</span>
                    </>
                  ) : (
                    <span>Remove</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation Modal */}
      {showDeleteGroupConfirmation && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Group?</h3>
              <p className="text-sm text-slate-600 mb-6">
                This will permanently delete this group for all members. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteGroupConfirmation(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteGroup}
                  disabled={isDeletingGroup}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isDeletingGroup ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Group Confirmation Modal */}
      {showLeaveGroupConfirmation && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <LogOut className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Leave Group?</h3>
              <p className="text-sm text-slate-600 mb-6">
                Are you sure you want to leave this group? You can be added back by a member.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLeaveGroupConfirmation(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLeaveGroup}
                  disabled={isLeavingGroup}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isLeavingGroup ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Leaving...</span>
                    </>
                  ) : (
                    <span>Leave</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Side Sheet */}
      <NavigationSideSheet
        isOpen={isSideSheetOpen}
        onClose={() => setIsSideSheetOpen(false)}
        companyId={companyId}
        companyName={company?.name || ''}
        enabledApps={company?.enabledApps}
      />
    </div>
  );
}

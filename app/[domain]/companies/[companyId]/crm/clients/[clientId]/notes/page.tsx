'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '@/app/[domain]/AuthProvider';
import {
  ChevronLeft,
  Plus,
  Edit2,
  Trash2,
  X,
  FileText,
  Calendar,
  Clock,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { NavigationMenuButton } from '@/components/navigation/NavigationSideSheet';

const noteFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  note: z.string().min(1, 'Note content is required'),
  noteDate: z.string().min(1, 'Date is required'),
  noteTime: z.string().optional(),
});

type NoteFormData = z.infer<typeof noteFormSchema>;

export default function ClientNotesPage() {
  const params = useParams();
  const domain = params.domain as string;
  const companyId = params.companyId as string;
  const clientId = params.clientId as string;

  const { user, isAuthenticated, isLoading: authLoading } = useAuthGuard();

  const company = useQuery(api.companies.getById, { companyId: companyId as any });
  const client = useQuery(
    api.clients.getClientById,
    user?.id && clientId ? { userId: user.id as any, clientId: clientId as any } : "skip"
  );
  const notes = useQuery(
    api.clientNotes.list,
    user?.id && clientId ? { userId: user.id as any, clientId: clientId as any } : "skip"
  );

  const createNote = useMutation(api.clientNotes.create);
  const updateNote = useMutation(api.clientNotes.update);
  const deleteNote = useMutation(api.clientNotes.remove);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: '',
      note: '',
      noteDate: new Date().toISOString().split('T')[0],
      noteTime: '',
    },
  });

  useEffect(() => {
    if (editingNote) {
      setValue('title', editingNote.title);
      setValue('note', editingNote.note);
      setValue('noteDate', editingNote.noteDate);
      setValue('noteTime', editingNote.noteTime || '');
    }
  }, [editingNote, setValue]);

  const handleCreateNote = async (data: NoteFormData) => {
    if (!user?.id) return;

    try {
      await createNote({
        userId: user.id as any,
        companyId: companyId as any,
        clientId: clientId as any,
        title: data.title,
        note: data.note,
        noteDate: data.noteDate,
        noteTime: data.noteTime || undefined,
      });

      toast.success('Note added successfully');
      setShowAddModal(false);
      reset();
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const handleUpdateNote = async (data: NoteFormData) => {
    if (!user?.id || !editingNote) return;

    try {
      await updateNote({
        userId: user.id as any,
        noteId: editingNote._id,
        title: data.title,
        note: data.note,
        noteDate: data.noteDate,
        noteTime: data.noteTime || undefined,
      });

      toast.success('Note updated successfully');
      setEditingNote(null);
      reset();
    } catch (error) {
      toast.error('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user?.id) return;

    try {
      await deleteNote({
        userId: user.id as any,
        noteId: noteId as any,
      });

      toast.success('Note deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const filteredNotes = notes?.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.note.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 py-4 text-sm overflow-x-auto">
            <a href="/companies" className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">
              Companies
            </a>
            <ChevronLeft className="h-4 w-4 text-slate-400 rotate-180 flex-shrink-0" />
            <a href={`/companies/${companyId}/manage`} className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">
              {company?.name || ''}
            </a>
            <ChevronLeft className="h-4 w-4 text-slate-400 rotate-180 flex-shrink-0" />
            <a href={`/companies/${companyId}/crm`} className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">
              CRM
            </a>
            <ChevronLeft className="h-4 w-4 text-slate-400 rotate-180 flex-shrink-0" />
            <a href={`/companies/${companyId}/crm/clients`} className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">
              Clients
            </a>
            <ChevronLeft className="h-4 w-4 text-slate-400 rotate-180 flex-shrink-0" />
            <span className="text-slate-900 font-medium whitespace-nowrap truncate max-w-[150px]">
              {client?.contactName || client?.companyName || 'Client'}
            </span>
            <ChevronLeft className="h-4 w-4 text-slate-400 rotate-180 flex-shrink-0" />
            <span className="text-slate-900 font-medium whitespace-nowrap">Notes</span>
          </div>

          {/* Title Section */}
          <div className="pb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Client Notes</h1>
                  <p className="text-slate-500">
                    {client?.companyName || client?.contactName || 'Loading...'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00072e] text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg"
              >
                <Plus className="h-4 w-4" />
                Add Note
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>

        {/* Notes Table - Desktop */}
        <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Title</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Note</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Date</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Time</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredNotes && filteredNotes.length > 0 ? (
                filteredNotes.map((note) => (
                  <tr key={note._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-900">{note.title}</span>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-sm text-slate-600 truncate">{note.note}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Calendar className="h-4 w-4" />
                        {note.noteDate}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {note.noteTime ? (
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Clock className="h-4 w-4" />
                          {note.noteTime}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingNote(note)}
                          className="p-2 text-slate-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(note._id)}
                          className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500">
                      {searchQuery ? 'No notes found' : 'No notes yet'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Notes Cards - Mobile */}
        <div className="md:hidden space-y-4">
          {filteredNotes && filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <div
                key={note._id}
                className="bg-white rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 text-sm">{note.title}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingNote(note)}
                      className="p-1.5 text-slate-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(note._id)}
                      className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{note.note}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {note.noteDate}
                  </div>
                  {note.noteTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {note.noteTime}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">
                {searchQuery ? 'No notes found' : 'No notes yet'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingNote) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingNote ? 'Edit Note' : 'Add New Note'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingNote(null);
                    reset();
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit(editingNote ? handleUpdateNote : handleCreateNote)}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Title
                </label>
                <input
                  {...register('title')}
                  type="text"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Enter note title"
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Note
                </label>
                <textarea
                  {...register('note')}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  placeholder="Enter note content"
                />
                {errors.note && (
                  <p className="mt-1 text-xs text-red-500">{errors.note.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Date
                  </label>
                  <input
                    {...register('noteDate')}
                    type="date"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  {errors.noteDate && (
                    <p className="mt-1 text-xs text-red-500">{errors.noteDate.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Time (optional)
                  </label>
                  <input
                    {...register('noteTime')}
                    type="time"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingNote(null);
                    reset();
                  }}
                  className="flex-1 px-5 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-5 py-2.5 bg-[#00072e] text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors"
                >
                  {editingNote ? 'Update' : 'Add Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Note?</h3>
              <p className="text-sm text-slate-500 mb-6">
                This action cannot be undone. Are you sure you want to delete this note?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-5 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteNote(deleteConfirmId)}
                  className="flex-1 px-5 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { ListSummary, listsApi } from '@/services/listsApi';
import ListFormModal from './ListFormModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableListItemProps {
  list: ListSummary;
  locale: 'ar' | 'en';
  onEdit: (list: ListSummary) => void;
  onDelete: (list: ListSummary) => void;
}

function SortableListItem({ list, locale, onEdit, onDelete }: SortableListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white border-2 rounded-xl p-6 transition-all duration-200
        ${isDragging 
          ? 'border-blue-400 shadow-lg z-10' 
          : 'border-gray-200 hover:border-gray-300'
        }
        ${locale === 'ar' ? 'text-right' : 'text-left'}
      `}
    >
      <div className={`flex items-center gap-4 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
        
        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </div>

        {/* List Info */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {locale === 'ar' ? list.title_ar : list.title_en}
          </h3>
          <p className="text-gray-600 text-sm mb-2">
            {locale === 'ar' ? list.description_ar : list.description_en}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              📝 {list.item_count} {locale === 'ar' ? 'عنصر' : 'items'}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              list.status === 'published' 
                ? 'bg-green-100 text-green-800' 
                : list.status === 'draft'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {list.status === 'published' 
                ? (locale === 'ar' ? 'منشور' : 'Published')
                : list.status === 'draft'
                ? (locale === 'ar' ? 'مسودة' : 'Draft')
                : (locale === 'ar' ? 'مؤرشف' : 'Archived')
              }
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className={`flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(`/${locale}/dashboard/admin/manage-lists/${list.id}/sections`, '_blank');
            }}
            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
            title={locale === 'ar' ? 'إدارة الأقسام' : 'Manage Sections'}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button
            onClick={() => onEdit(list)}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title={locale === 'ar' ? 'تحرير' : 'Edit'}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          
          <button
            onClick={() => onDelete(list)}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title={locale === 'ar' ? 'حذف' : 'Delete'}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManageListsPage() {
  // const t = useTranslations('AdminDashboard');
  const locale = useLocale() as 'ar' | 'en';
  
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<ListSummary | null>(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch lists
  const fetchLists = async () => {
    try {
      setLoading(true);
      const response = await listsApi.getLists(1, 100, ''); // Get all lists
      setLists(response.data.data);
    } catch (err) {
      setError('Failed to load lists');
      console.error('Error fetching lists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = lists.findIndex(item => item.id === active.id);
      const newIndex = lists.findIndex(item => item.id === over?.id);
      
      const reorderedLists = arrayMove(lists, oldIndex, newIndex);
      
      // Update local state optimistically
      setLists(reorderedLists);

      try {
        setSaving(true);
        const listOrders = reorderedLists.map((list, index) => ({
          list_id: list.id,
          sort_order: index + 1,
        }));
        
        await listsApi.reorderLists(listOrders);
      } catch (err) {
        console.error('Error reordering lists:', err);
        // Revert on error
        fetchLists();
      } finally {
        setSaving(false);
      }
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedList) return;

    try {
      setSaving(true);
      await listsApi.deleteList(selectedList.id);
      setLists(lists.filter(list => list.id !== selectedList.id));
      setIsDeleteModalOpen(false);
      setSelectedList(null);
    } catch (err) {
      console.error('Error deleting list:', err);
      setError('Failed to delete list');
    } finally {
      setSaving(false);
    }
  };

  // Handle form submission
  const handleFormSubmit = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedList(null);
    fetchLists(); // Refresh data
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className={`flex justify-between items-center mb-8 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {locale === 'ar' ? 'إدارة القوائم' : 'Manage Lists'}
            </h1>
            <p className="text-gray-600">
              {locale === 'ar' 
                ? 'إنشاء وتحرير وترتيب قوائم المطاعم والأماكن' 
                : 'Create, edit, and organize restaurant and place lists'
              }
            </p>
          </div>
          
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {locale === 'ar' ? '+ إضافة قائمة جديدة' : '+ Add New List'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Drag and Drop Lists */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6">
            {lists.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {locale === 'ar' ? 'لا توجد قوائم' : 'No Lists Yet'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {locale === 'ar' 
                    ? 'ابدأ بإنشاء قائمتك الأولى من المطاعم والأماكن المميزة'
                    : 'Start by creating your first list of amazing restaurants and places'
                  }
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {locale === 'ar' ? 'إضافة قائمة جديدة' : 'Create Your First List'}
                </button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={lists.map(list => list.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {lists.map((list) => (
                      <SortableListItem
                        key={list.id}
                        list={list}
                        locale={locale}
                        onEdit={(list) => {
                          setSelectedList(list);
                          setIsEditModalOpen(true);
                        }}
                        onDelete={(list) => {
                          setSelectedList(list);
                          setIsDeleteModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {/* Saving Indicator */}
        {saving && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
            {locale === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
          </div>
        )}

        {/* Modals */}
        <ListFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleFormSubmit}
          mode="create"
        />

        <ListFormModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedList(null);
          }}
          onSuccess={handleFormSubmit}
          mode="edit"
          list={selectedList}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedList(null);
          }}
          onConfirm={handleDelete}
          listName={selectedList ? (locale === 'ar' ? selectedList.title_ar : selectedList.title_en) : ''}
          loading={saving}
        />
      </div>
    </div>
  );
}
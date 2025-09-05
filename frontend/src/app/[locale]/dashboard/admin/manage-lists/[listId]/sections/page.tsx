'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { ListDetail, ListSection, listsApi } from '@/services/listsApi';
import SectionFormModal from '@/components/lists/EnhancedSectionFormModal';
import SectionCard from '@/components/lists/SectionCard';
import DeleteConfirmModal from '../../DeleteConfirmModal';
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
  rectSortingStrategy,
} from '@dnd-kit/sortable';

export default function ListSectionsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale() as 'ar' | 'en';
  
  const listId = params.listId as string;
  
  const [list, setList] = useState<ListDetail | null>(null);
  const [sections, setSections] = useState<ListSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<ListSection | null>(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch list and sections
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const listData = await listsApi.getListById(listId);
      setList(listData);
      setSections(listData.list_sections || []);
    } catch (err) {
      setError('Failed to load list data');
      console.error('Error fetching list:', err);
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = sections.findIndex(item => item.id === active.id);
      const newIndex = sections.findIndex(item => item.id === over?.id);
      
      const reorderedSections = arrayMove(sections, oldIndex, newIndex);
      
      // Update local state optimistically
      setSections(reorderedSections);

      try {
        setSaving(true);
        const sectionOrders = reorderedSections.map((section, index) => ({
          section_id: section.id,
          sort_order: index + 1,
        }));
        
        await listsApi.reorderListSections(listId, sectionOrders);
      } catch (err) {
        console.error('Error reordering sections:', err);
        // Revert on error
        fetchData();
      } finally {
        setSaving(false);
      }
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedSection) return;

    try {
      setSaving(true);
      await listsApi.deleteListSection(listId, selectedSection.id);
      setSections(sections.filter(section => section.id !== selectedSection.id));
      setIsDeleteModalOpen(false);
      setSelectedSection(null);
    } catch (err) {
      console.error('Error deleting section:', err);
      setError('Failed to delete section');
    } finally {
      setSaving(false);
    }
  };

  // Handle form submission
  const handleFormSubmit = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedSection(null);
    fetchData(); // Refresh data
  };

  // Handle section click - navigate to section items management
  const handleSectionClick = (section: ListSection) => {
    router.push(`/${locale}/dashboard/admin/manage-lists/${listId}/sections/${section.id}/items`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {locale === 'ar' ? 'القائمة غير موجودة' : 'List Not Found'}
          </h1>
          <p className="text-gray-600 mb-4">
            {locale === 'ar' ? 'عذراً، القائمة المطلوبة غير متوفرة' : 'Sorry, the requested list is not available'}
          </p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {locale === 'ar' ? 'العودة' : 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  const listTitle = locale === 'ar' ? list.title_ar : list.title_en;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className={`mb-8 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
          <div className={`flex items-center gap-4 mb-4 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={() => router.push(`/${locale}/dashboard/admin/manage-lists`)}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className={`w-6 h-6 ${locale === 'ar' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            <div className="flex-1">
              <nav className="text-sm text-gray-500 mb-2">
                <span>{locale === 'ar' ? 'القوائم' : 'Lists'}</span>
                <span className="mx-2">/</span>
                <span>{listTitle}</span>
                <span className="mx-2">/</span>
                <span className="text-gray-900">{locale === 'ar' ? 'الأقسام' : 'Sections'}</span>
              </nav>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {locale === 'ar' ? `أقسام: ${listTitle}` : `Sections: ${listTitle}`}
              </h1>
              
              <p className="text-gray-600">
                {locale === 'ar' 
                  ? 'إنشاء وتنظيم أقسام القائمة. اسحب الأقسام لإعادة ترتيبها.' 
                  : 'Create and organize list sections. Drag sections to reorder them.'
                }
              </p>
            </div>
          </div>
          
          <div className={`flex gap-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {locale === 'ar' ? '+ إضافة قسم جديد' : '+ Add New Section'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Sections Grid */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          {sections.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-6">
                <svg className="w-20 h-20 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                {locale === 'ar' ? 'لا توجد أقسام بعد' : 'No Sections Yet'}
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {locale === 'ar' 
                  ? 'ابدأ بإنشاء أقسام لتنظيم المحتوى في قائمتك. كل قسم يمكن أن يحتوي على عنوان ووصف وصور وعناصر متعددة.'
                  : 'Start by creating sections to organize content in your list. Each section can contain a title, description, images, and multiple items.'
                }
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {locale === 'ar' ? 'إنشاء القسم الأول' : 'Create First Section'}
              </button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={sections.map(section => section.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sections.map((section) => (
                    <SectionCard
                      key={section.id}
                      section={section}
                      onClick={handleSectionClick}
                      onEdit={(section) => {
                        setSelectedSection(section);
                        setIsEditModalOpen(true);
                      }}
                      onDelete={(section) => {
                        setSelectedSection(section);
                        setIsDeleteModalOpen(true);
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Saving Indicator */}
        {saving && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
            {locale === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
          </div>
        )}

        {/* Modals */}
        <SectionFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleFormSubmit}
          listId={listId}
          mode="create"
        />

        <SectionFormModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedSection(null);
          }}
          onSuccess={handleFormSubmit}
          listId={listId}
          mode="edit"
          section={selectedSection}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedSection(null);
          }}
          onConfirm={handleDelete}
          listName={selectedSection ? (locale === 'ar' ? selectedSection.title_ar : selectedSection.title_en) : ''}
          loading={saving}
        />
      </div>
    </div>
  );
}
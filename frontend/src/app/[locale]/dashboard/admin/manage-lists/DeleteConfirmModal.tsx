'use client';

import { useLocale } from 'next-intl';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  listName: string;
  loading?: boolean;
}

export default function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  listName, 
  loading = false 
}: DeleteConfirmModalProps) {
  const locale = useLocale() as 'ar' | 'en';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
              <h3 className="text-lg font-semibold text-gray-900">
                {locale === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
              </h3>
              <p className="text-sm text-gray-600">
                {locale === 'ar' ? 'هذا الإجراء لا يمكن التراجع عنه' : 'This action cannot be undone'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={`p-6 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
          <p className="text-gray-700 mb-4">
            {locale === 'ar' 
              ? `هل أنت متأكد من حذف القائمة "${listName}"؟`
              : `Are you sure you want to delete the list "${listName}"?`
            }
          </p>
          <p className="text-sm text-gray-500">
            {locale === 'ar' 
              ? 'سيتم حذف جميع العناصر المرتبطة بهذه القائمة أيضاً.'
              : 'All items associated with this list will also be deleted.'
            }
          </p>
        </div>

        {/* Actions */}
        <div className={`flex gap-3 p-6 border-t bg-gray-50 rounded-b-xl ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {locale === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading 
              ? (locale === 'ar' ? 'جاري الحذف...' : 'Deleting...') 
              : (locale === 'ar' ? 'حذف' : 'Delete')
            }
          </button>
        </div>
      </div>
    </div>
  );
}
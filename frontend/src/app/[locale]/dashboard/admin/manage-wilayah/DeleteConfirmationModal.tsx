import React from 'react';
import { AlertCircle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  deleteConfirm: any;
  deleteLoading: boolean;
  onCancel: () => void;
  onConfirm: (wilayah: any) => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  deleteConfirm,
  deleteLoading,
  onCancel,
  onConfirm,
}) => {
  if (!deleteConfirm) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Wilayah</h3>
              <p className="text-gray-600">This action cannot be undone.</p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Wilayah:</strong> {deleteConfirm.name_en} ({deleteConfirm.name_ar})
            </p>
            <p className="text-sm text-gray-700">
              <strong>Governate:</strong> {deleteConfirm.governate?.name_en}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Places:</strong> {deleteConfirm.place_count} associated places
            </p>
            {deleteConfirm.images && deleteConfirm.images.length > 0 && (
              <p className="text-sm text-gray-700">
                <strong>Images:</strong> {deleteConfirm.images.length} will be deleted
              </p>
            )}
          </div>

          {deleteConfirm.place_count > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Warning: This wilayah has {deleteConfirm.place_count} associated places. 
                Deletion may fail if there are dependencies.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              disabled={deleteLoading}
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(deleteConfirm)}
              disabled={deleteLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {deleteLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
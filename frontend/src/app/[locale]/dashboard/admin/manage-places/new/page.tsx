"use client";
import AddPlaceForm from '@/components/PlaceForm/AddPlaceForm';

export default function AddNewTourismPlace() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Tourism Place</h1>
          <p className="text-gray-600">Create a new tourism destination with photos and detailed information</p>
        </div>
        
        <AddPlaceForm />
      </div>
    </div>
  );
}
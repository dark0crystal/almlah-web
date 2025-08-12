// src/services/placeImageService.js
// Simple image upload service - Upload to Supabase first, then send URLs to Go backend

import { SupabaseStorageService } from './supabaseStorage';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000/api/v1';

export const placeImageService = {
  /**
   * Simple flow: Upload to Supabase -> Send URLs to Go backend
   */
  uploadImages: async (placeId, imageFiles, imageMetadata = []) => {
    console.log('🚀 Starting simple image upload for place:', placeId);
    
    try {
      // Step 1: Upload files to Supabase Storage first
      console.log('📤 Step 1: Uploading files to Supabase...');
      
      const supabaseImages = imageFiles.map((file, index) => ({
        file,
        isPrimary: imageMetadata[index]?.isPrimary || (index === 0),
        altText: imageMetadata[index]?.altText || '',
        displayOrder: imageMetadata[index]?.displayOrder || (index + 1)
      }));

      const supabaseResults = await SupabaseStorageService.uploadPlaceImages(placeId, supabaseImages);
      console.log('✅ Supabase upload complete:', supabaseResults);

      // Step 2: Send URLs to Go backend
      console.log('📤 Step 2: Sending URLs to Go backend...');
      
      const backendData = {
        images: supabaseResults.map(result => ({
          image_url: result.url,
          alt_text: result.altText,
          is_primary: result.isPrimary,
          display_order: result.displayOrder
        }))
      };

      const response = await fetch(`${API_BASE_URL}/places/${placeId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backendData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Backend save complete:', result);

      return {
        success: true,
        data: result.data
      };

    } catch (error) {
      console.error('💥 Upload failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get place images
   */
  getPlaceImages: async (placeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/places/${placeId}/images`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { success: true, data: [] };
        }
        throw new Error(`Failed to fetch images: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching images:', error);
      throw error;
    }
  },

  /**
   * Update image metadata
   */
  updateImage: async (placeId, imageId, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/places/${placeId}/images/${imageId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update image: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating image:', error);
      throw error;
    }
  },

  /**
   * Delete image (deletes from both Supabase and backend)
   */
  deleteImage: async (placeId, imageId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/places/${placeId}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete image: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }
};
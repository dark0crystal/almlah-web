// src/services/placesApi.ts
import { Place } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:9000/api/v1";

export const fetchPlaces = async (): Promise<Place[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/places`);
    if (!response.ok) {
      throw new Error('Failed to fetch places');
    }
    const data = await response.json();
    return data.data; // Assuming your API returns { success: true, data: [...] }
  } catch (error) {
    console.error('Error fetching places:', error);
    throw error;
  }
};

export const searchPlaces = async (query: string): Promise<Place[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/places/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Search failed');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error searching places:', error);
    throw error;
  }
};

export const fetchPlaceById = async (id: string): Promise<Place> => {
  try {
    const response = await fetch(`${API_BASE_URL}/places/${id}`);
    if (!response.ok) {
      throw new Error('Place not found');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching place ${id}:`, error);
    throw error;
  }
};

// Add other API calls as needed (get by category, wilayah, etc.)
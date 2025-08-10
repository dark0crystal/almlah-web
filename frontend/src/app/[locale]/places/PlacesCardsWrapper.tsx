"use client"
import { useEffect, useState } from "react";
import PlaceCard from "./PlaceCard";
import SearchBar from "./SearchBar";
import { fetchPlaces, searchPlaces } from "@/services/placesApi";
import { Place } from "@/types";

export default function PlacesCardsWrapper() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlaces = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPlaces();
        
        // Debug log to see the actual data structure
        console.log('API Response:', data);
        console.log('First place:', data[0]);
        if (data[0]) {
          console.log('First place name:', data[0].name);
          console.log('Name type:', typeof data[0].name);
        }
        
        setPlaces(data);
      } catch (err: any) {
        console.error('Error loading places:', err);
        setError(err.message || 'Failed to load places');
      } finally {
        setLoading(false);
      }
    };

    loadPlaces();
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      // If empty query, reload all places
      try {
        const data = await fetchPlaces();
        setPlaces(data);
      } catch (err: any) {
        setError(err.message);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const results = await searchPlaces(query);
      setPlaces(results);
    } catch (err: any) {
      console.error('Error searching places:', err);
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center min-h-[200px]">
        <div className="text-lg">Loading places...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-red-500 text-center">
        <div className="text-lg font-semibold">Error: {error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="p-4 text-center">
        <SearchBar onSearch={handleSearch} />
        <div className="mt-8 text-gray-500">
          <p className="text-lg">No places found</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SearchBar onSearch={handleSearch} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {places.map((place) => (
          <PlaceCard key={place.id} place={place} />
        ))}
      </div>
    </div>
  );
}
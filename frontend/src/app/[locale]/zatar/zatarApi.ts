interface ZatarRecommendationRequest {
  place_name: string;
  food_type: string;
  locale: string;
}

interface ZatarRecommendation {
  id: string;
  name: string;
  type: string;
  address: string;
  rating?: number;
  distance?: string;
  cuisine: string;
  place_id?: string;
  phone?: string;
  website?: string;
  opening_time?: string;
  closing_time?: string;
  price_range?: string;
  image_url?: string;
}

interface ZatarResponse {
  success: boolean;
  message: string;
  data: ZatarRecommendation;
}

interface ZatarMultipleResponse {
  success: boolean;
  message: string;
  recommendations: ZatarRecommendation[];
  count: number;
  generated_at: string;
  search_criteria: {
    place_name: string;
    food_type: string;
    locale: string;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

export const zatarApi = {
  async getRandomRecommendation(req: ZatarRecommendationRequest): Promise<ZatarRecommendation> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/zatar/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ZatarResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to get recommendation');
      }

      return data.data;
    } catch (error) {
      console.error('Error getting recommendation:', error);
      throw error;
    }
  },

  async getMultipleRecommendations(req: ZatarRecommendationRequest, count: number = 3): Promise<ZatarRecommendation[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/zatar/recommend/multiple?count=${count}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ZatarMultipleResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to get recommendations');
      }

      return data.recommendations;
    } catch (error) {
      console.error('Error getting multiple recommendations:', error);
      throw error;
    }
  },

  async getGameStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/zatar/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to get game stats');
      }

      return data.data;
    } catch (error) {
      console.error('Error getting game stats:', error);
      throw error;
    }
  }
};

export type { ZatarRecommendation, ZatarRecommendationRequest };
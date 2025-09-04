const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST ? `${process.env.NEXT_PUBLIC_API_HOST}/api/v1` : "http://localhost:9000/api/v1";

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get auth token
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export interface ListSummary {
  id: string;
  title_ar: string;
  title_en: string;
  slug: string;
  description_ar: string;
  description_en: string;
  featured_image: string;
  status: string;
  item_count: number;
  created_at: string;
}

export interface ListItem {
  id: string;
  list_id: string;
  section_id?: string;
  place_id?: string;
  content_ar: string;
  content_en: string;
  sort_order: number;
  item_type: 'place' | 'separator' | 'custom_content';
  created_at: string;
  updated_at: string;
  section?: {
    id: string;
    title_ar: string;
    title_en: string;
    description_ar: string;
    description_en: string;
    sort_order: number;
  };
  place?: {
    id: string;
    name_ar: string;
    name_en: string;
    description_ar: string;
    description_en: string;
    subtitle_ar: string;
    subtitle_en: string;
    images: string[];
  };
  images: {
    id: string;
    image_url: string;
    alt_text_ar: string;
    alt_text_en: string;
    sort_order: number;
    created_at: string;
  }[];
}

export interface ListSection {
  id: string;
  list_id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  section_items: ListItem[];
  images: {
    id: string;
    image_url: string;
    alt_text_ar: string;
    alt_text_en: string;
    sort_order: number;
    created_at: string;
  }[];
}

export interface ListDetail {
  id: string;
  title_ar: string;
  title_en: string;
  slug: string;
  description_ar: string;
  description_en: string;
  featured_image: string;
  status: string;
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  list_items: ListItem[];
  list_sections: ListSection[];
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PaginatedListsResponse {
  success: boolean;
  message: string;
  data: {
    data: ListSummary[];
    pagination: {
      current_page: number;
      per_page: number;
      total: number;
      total_pages: number;
    };
  };
}

export const listsApi = {
  // Get all lists with pagination
  async getLists(page: number = 1, limit: number = 10, status: string = 'published'): Promise<PaginatedListsResponse> {
    return fetchAPI(`/lists?page=${page}&limit=${limit}&status=${status}`);
  },

  // Get a specific list by slug
  async getListBySlug(slug: string): Promise<ListDetail> {
    const response = await fetchAPI(`/lists/slug/${slug}`);
    return response.data;
  },

  // Get a specific list by ID
  async getListById(id: string): Promise<ListDetail> {
    const response = await fetchAPI(`/lists/${id}`);
    return response.data;
  },

  // Admin endpoints (require authentication)
  async createList(data: {
    title_ar: string;
    title_en: string;
    slug: string;
    description_ar: string;
    description_en: string;
    featured_image?: string;
    status?: string;
  }): Promise<ListDetail> {
    const response = await fetchAPI('/lists', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async updateList(id: string, data: Partial<{
    title_ar: string;
    title_en: string;
    slug: string;
    description_ar: string;
    description_en: string;
    featured_image: string;
    status: string;
  }>): Promise<ListDetail> {
    const response = await fetchAPI(`/lists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async deleteList(id: string): Promise<void> {
    return fetchAPI(`/lists/${id}`, {
      method: 'DELETE',
    });
  },

  async reorderLists(listOrders: { list_id: string; sort_order: number }[]): Promise<void> {
    return fetchAPI('/lists/reorder', {
      method: 'PUT',
      body: JSON.stringify({ list_orders: listOrders }),
    });
  },

  // List item management
  async createListItem(listId: string, data: {
    place_id?: string;
    content_ar: string;
    content_en: string;
    item_type: 'place' | 'separator' | 'custom_content';
    images?: {
      image_url: string;
      alt_text_ar: string;
      alt_text_en: string;
      sort_order: number;
    }[];
  }): Promise<ListItem> {
    const response = await fetchAPI(`/lists/${listId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async updateListItem(listId: string, itemId: string, data: Partial<{
    place_id: string;
    content_ar: string;
    content_en: string;
    item_type: 'place' | 'separator' | 'custom_content';
  }>): Promise<ListItem> {
    const response = await fetchAPI(`/lists/${listId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async deleteListItem(listId: string, itemId: string): Promise<void> {
    return fetchAPI(`/lists/${listId}/items/${itemId}`, {
      method: 'DELETE',
    });
  },

  async reorderListItems(listId: string, itemOrders: { item_id: string; sort_order: number }[]): Promise<void> {
    return fetchAPI(`/lists/${listId}/items/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ item_orders: itemOrders }),
    });
  },

  // List section management
  async createListSection(listId: string, data: {
    title_ar: string;
    title_en: string;
    description_ar: string;
    description_en: string;
    images?: {
      image_url: string;
      alt_text_ar: string;
      alt_text_en: string;
      sort_order: number;
    }[];
  }): Promise<ListSection> {
    const response = await fetchAPI(`/lists/${listId}/sections`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async updateListSection(listId: string, sectionId: string, data: Partial<{
    title_ar: string;
    title_en: string;
    description_ar: string;
    description_en: string;
  }>): Promise<ListSection> {
    const response = await fetchAPI(`/lists/${listId}/sections/${sectionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async deleteListSection(listId: string, sectionId: string): Promise<void> {
    return fetchAPI(`/lists/${listId}/sections/${sectionId}`, {
      method: 'DELETE',
    });
  },

  async reorderListSections(listId: string, sectionOrders: { section_id: string; sort_order: number }[]): Promise<void> {
    return fetchAPI(`/lists/${listId}/sections/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ section_orders: sectionOrders }),
    });
  },
};
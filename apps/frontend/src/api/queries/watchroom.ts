import { apiRequest } from '../apiRequest';
import type { Watchroom, WatchroomDetails } from '../types/watchroom';
import type { Recommendation } from '../types/recommendation';

export const createWatchroom = async (payload: { name: string; description?: string }): Promise<Watchroom> => {
  return apiRequest<Watchroom>('/watchrooms', {
    method: 'POST',
    body: payload,
  });
};

export const getMyWatchrooms = async (
  page: number = 1,
  pageSize: number = 20,
): Promise<{ data: Watchroom[]; metadata: { page: number; pageSize: number; total: number } }> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  return apiRequest<{
    data: Watchroom[];
    metadata: { page: number; pageSize: number; total: number };
  }>('/watchrooms', {
    method: 'GET',
    params,
  });
};

export const getPublicWatchroomDetails = async (publicLinkId: string): Promise<Watchroom> => {
  return apiRequest<Watchroom>(`/watchrooms/by-link/${publicLinkId}`, {
    method: 'GET',
    requiresAuth: false,
  });
};

export const joinWatchroom = async (publicLinkId: string): Promise<Watchroom> => {
  return apiRequest<Watchroom>(`/watchrooms/by-link/${publicLinkId}/participants`, {
    method: 'POST',
  });
};

export const getWatchroomDetails = async (watchroomId: string): Promise<WatchroomDetails> => {
  return apiRequest<WatchroomDetails>(`/watchrooms/${watchroomId}`, {
    method: 'GET',
  });
};

export const removeParticipant = async (watchroomId: string, participantId: string): Promise<void> => {
  return apiRequest<void>(`/watchrooms/${watchroomId}/participants/${participantId}`, {
    method: 'DELETE',
  });
};

export const leaveWatchroom = async (watchroomId: string): Promise<void> => {
  return apiRequest<void>(`/watchrooms/${watchroomId}/leave`, {
    method: 'POST',
  });
};

export const deleteWatchroom = async (watchroomId: string): Promise<void> => {
  return apiRequest<void>(`/watchrooms/${watchroomId}`, {
    method: 'DELETE',
  });
};

export const updateWatchroom = async (
  watchroomId: string,
  payload: { name?: string; description?: string },
): Promise<Watchroom> => {
  return apiRequest<Watchroom>(`/watchrooms/${watchroomId}`, {
    method: 'PATCH',
    body: payload,
  });
};

export const generateRecommendations = async (watchroomId: string): Promise<{ recommendationRequestId: string }> => {
  return apiRequest<{ recommendationRequestId: string }>(`/watchrooms/${watchroomId}/recommendations/generate`, {
    method: 'POST',
  });
};

export const checkRecommendationStatus = async (
  watchroomId: string,
  recommendationRequestId: string,
): Promise<{ status: 'pending' | 'completed' | 'failed' }> => {
  return apiRequest<{ status: 'pending' | 'completed' | 'failed' }>(
    `/watchrooms/${watchroomId}/recommendations/status/${recommendationRequestId}`,
    {
      method: 'GET',
    },
  );
};

export const getRecommendations = async (watchroomId: string): Promise<Recommendation[]> => {
  return apiRequest<Recommendation[]>(`/watchrooms/${watchroomId}/recommendations`, {
    method: 'GET',
  });
};

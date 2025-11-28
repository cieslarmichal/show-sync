import { apiRequest } from '../apiRequest';

export interface UpdateUserLanguagePayload {
  readonly language: 'en' | 'pl';
}

export const updateUserLanguage = async (payload: UpdateUserLanguagePayload): Promise<void> => {
  await apiRequest('/users/me/language', {
    method: 'PATCH',
    body: payload,
  });
};

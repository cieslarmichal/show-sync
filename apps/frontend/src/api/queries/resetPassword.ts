import { apiRequest } from '../apiRequest';

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export const resetPassword = async (payload: ResetPasswordPayload): Promise<void> => {
  await apiRequest('/users/change-password', {
    method: 'POST',
    body: payload,
    requiresAuth: false,
  });
};

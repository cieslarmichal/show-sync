import { apiRequest } from '../apiRequest';

export interface RequestPasswordResetPayload {
  email: string;
}

export const requestPasswordReset = async (payload: RequestPasswordResetPayload): Promise<void> => {
  await apiRequest('/users/reset-password', {
    method: 'POST',
    body: payload,
  });
};

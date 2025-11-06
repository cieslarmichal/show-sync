import { apiRequest } from '../apiRequest';

export interface ValidateOneTimeTokenPayload {
  token: string;
  purpose: 'reset-password';
}

export interface ValidateOneTimeTokenResponse {
  valid: boolean;
}

export const validateOneTimeToken = async (
  payload: ValidateOneTimeTokenPayload,
): Promise<ValidateOneTimeTokenResponse> => {
  return apiRequest<ValidateOneTimeTokenResponse>('/one-time-tokens/validate', {
    method: 'POST',
    body: payload,
    requiresAuth: false,
  });
};

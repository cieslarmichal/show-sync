import { apiRequest } from '../apiRequest';

type ResendVerificationEmailRequest = {
  email: string;
};

export const resendVerificationEmail = async (input: ResendVerificationEmailRequest): Promise<void> => {
  await apiRequest<void>('/users/resend-verification-email', {
    method: 'POST',
    body: {
      email: input.email,
    },
  });
};

import { apiRequest } from '../apiRequest';
import { User } from '../types/user';

type RegisterUserRequest = {
  name: string;
  email: string;
  password: string;
};

export const registerUser = async (input: RegisterUserRequest): Promise<User> => {
  return await apiRequest<User>('/users/register', {
    method: 'POST',
    body: {
      name: input.name,
      email: input.email,
      password: input.password,
    },
  });
};

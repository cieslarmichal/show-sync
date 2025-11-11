import { apiRequest } from '../apiRequest';
import { User } from '../types/user';

type RegisterUserRequest = {
  name: string;
  email: string;
  password: string;
};

export const registerUser = async (input: RegisterUserRequest): Promise<User> => {
  try {
    return await apiRequest<User>('/users/register', {
      method: 'POST',
      body: {
        name: input.name,
        email: input.email,
        password: input.password,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('409')) {
      throw new Error('User with this email already exists');
    }
    throw new Error('Registration error');
  }
};

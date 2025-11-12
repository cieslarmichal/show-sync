import { apiRequest } from '../apiRequest';
import { logger } from '../../utils/logger';

export const logoutUser = async (): Promise<void> => {
  try {
    await apiRequest<void>('/users/logout', {
      method: 'POST',
    });
  } catch (error) {
    logger.warn('Logout request failed, but continuing with local cleanup:', error);
  }
};

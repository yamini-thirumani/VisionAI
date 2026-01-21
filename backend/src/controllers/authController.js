
import authService from '../services/authService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { HTTP_STATUS } from '../config/constants';

/**
 * Login controller
 * Handles HTTP request/response only
 */
const login = async (req, res, next) => {
  try {
    // 1. Extract data from request
    const { email, password } = req.body;
    
    // 2. Call service (business logic)
    const result = await authService.login(email, password);
    
    // 3. Send success response
    sendSuccess(res, HTTP_STATUS.OK, 'Login successful', result);
    
  } catch (error) {
    // 4. Pass error to error handler
    next(error);
  }
};
export{ login };
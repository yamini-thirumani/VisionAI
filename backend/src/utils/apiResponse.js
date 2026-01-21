import {HTTP_STATUS} from '../config/constants';

export const sendSuccess = (res, statusCode = HTTP_STATUS.OK, message = 'Success', data = null) => {
    const response = {
        success : true,
        message,
        data
    };
    return res.status(statusCode).json(response);
};

export const sendError = (res, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, message = 'Error', data = null) => {
    const response = {
        success : false,
        message,
        ...(errors && { errors }) 
    };
    return res.status(statusCode).json(response);
};

export const sendPaginated = (res, data, pagination) => {
  const response = {
    success: true,
    data,
    pagination: {
      currentPage: pagination.page,
      totalPages: pagination.totalPages,
      totalItems: pagination.totalItems,
      itemsPerPage: pagination.limit,
      hasNextPage: pagination.page < pagination.totalPages,
      hasPrevPage: pagination.page > 1
    }
  };

  return res.status(HTTP_STATUS.OK).json(response);
};

export{
  sendSuccess,
  sendError,
  sendPaginated
};
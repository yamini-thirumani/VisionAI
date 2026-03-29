import jwt from 'jsonwebtoken';
import { AuthenticationError } from '../utils/errorTypes.js';

const generateToken = (payload) =>{
    return jwt.sign(payload, process.env.JWT_SECRET,{
        expiresIn : process.env.JWT_EXPIRE,
        issuer : 'backend'
    });
};

const verifyToken = (token) =>{
    try{
        return jwt.verify(token,process.env.JWT_SECRET);
    }
    catch(error){
        if (error.name === 'TokenExpiredError') {
            throw new AuthenticationError('Token has expired');
        } 
        else if (error.name === 'JsonWebTokenError') {
            throw new AuthenticationError('Invalid token');
        } 
        else {
            throw new AuthenticationError('Token verification failed');
        }
    }
};

const decodeToken = (token) => {
    return jwt.decode(token);
}

export {generateToken, verifyToken, decodeToken};
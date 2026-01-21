import mongoose from 'mongoose';
const connectDB = async() =>{
    try{
        const options = {
            maxPoolSize : 10,
            serverSelectionTimeoutMS : 5000,
            socketTimeoutMS : 45000,
        }
        const conn = await mongoose.connect(process.env.MONGO_URI,options);
        console.log(`MongoDB Connected : ${conn.connection.host}`);
        console.log(`Database : ${conn.connection.name}`);
        mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    }
    catch(e){
        console.error('MongoDB Connection failed : ',e.message);
        process.exit(1);

    }
};

const disconnectDB = async() =>{
    try{
        await mongoose.connection.close();
        console.log("MongoDB Connection Closed");
    }
    catch(error){
        console.error("Error closing MongoDB connection: ", error.message);
    }
};

export {connectDB, disconnectDB};
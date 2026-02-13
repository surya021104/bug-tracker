import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bug-tracker';

        await mongoose.connect(mongoURI);

        console.log('✅ MongoDB connected successfully');
        console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.log('⚠️  Continuing with in-memory storage as fallback');
        // Don't exit - allow server to continue with in-memory storage
    }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
    console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err);
});

export default connectDB;

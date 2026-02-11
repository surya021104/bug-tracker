import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ApiKey from './models/ApiKey.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        // Find the key ending in 6F4B
        const keys = await ApiKey.find();
        const targetKey = keys.find(k => k.apiKey.endsWith('6F4B'));

        if (targetKey) {
            console.log('\n✅ KEY FOUND:');
            console.log('==================================================');
            console.log(`App Name: ${targetKey.appName}`);
            console.log(`API Key:  ${targetKey.apiKey}`);
            console.log('==================================================\n');
        } else {
            console.log('❌ Key not found');
        }

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

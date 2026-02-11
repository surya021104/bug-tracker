import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const ApiKeySchema = new mongoose.Schema({
    apiKey: String,
    appName: String,
    apiKeyPreview: String
});
const ApiKey = mongoose.model('ApiKey', ApiKeySchema);

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        // Find the key matching pattern
        const keys = await ApiKey.find();
        // Look for key ending in 6F4B
        const targetKey = keys.find(k => k.apiKey && k.apiKey.endsWith('6F4B'));

        if (targetKey) {
            console.log('\n✅ KEY FOUND:');
            console.log('APP NAME: ' + targetKey.appName);
            console.log('FULL KEY: ' + targetKey.apiKey);
        } else {
            console.log('❌ Key not found');
            // Print all previews to see what's there
            console.log('Available keys:', keys.map(k => k.apiKeyPreview));
        }

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

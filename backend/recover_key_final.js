import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://localhost:27017/bug-tracker';

const ApiKeySchema = new mongoose.Schema({
    apiKey: String,
    appName: String,
    apiKeyPreview: String
});
const ApiKey = mongoose.model('ApiKey', ApiKeySchema);

mongoose.connect(MONGO_URI)
    .then(async () => {
        // Find key ending in 6F4B
        const keys = await ApiKey.find();
        const targetKey = keys.find(k => k.apiKey && k.apiKey.endsWith('6F4B'));

        if (targetKey) {
            console.log('KEY_FOUND:' + targetKey.apiKey);
        } else {
            console.log('KEY_NOT_FOUND');
        }

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

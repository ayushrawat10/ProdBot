const mongoose = require('mongoose');

// Define the connection URL
const mongoURL = process.env.MONGO_DB;

// Connect to MongoDB
async function connect() {
	try {
		await mongoose.connect(mongoURL, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log('Connected to MongoDB');
	}
	catch (error) {
		console.error('Error connecting to MongoDB:', error);
	}
}

module.exports = {
	connect,
};
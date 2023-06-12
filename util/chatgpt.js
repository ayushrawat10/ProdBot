const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config({ path:'../' });

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

const chatgpt = {
	messages: [],

	sendMessageToAI: async function(message) {
		this.messages = [];
		this.messages.push({ role: 'user', content: message });

		try {
			const chatGPTinst = await openai.createChatCompletion({
				model: 'gpt-3.5-turbo',
				messages: this.messages,
			});

			// Extract the generated reply from the API response
			const reply = chatGPTinst.data.choices[0].message.content;
			this.messages.push({ role: 'assistant', content: reply });
			return reply;
		}
		catch (error) {
			console.error('Failed to communicate with OpenAI API:', error);
			return 'An error occurred while communicating with the AI.';
		}
	},
};
module.exports = chatgpt;
const { SlashCommandBuilder } = require('@discordjs/builders');
const { sendMessageToAI } = require('../../util/chatgpt');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('chat')
		.setDescription('Chat with the AI')
		.addStringOption(option =>
			option.setName('message')
				.setDescription('The message to send to the AI')
				.setRequired(true)),

	async execute(interaction) {
		const userMessage = interaction.options.getString('message');

		// Send the user's message to the AI model
		interaction.deferReply({ ephemeral: true });
		const aiResponse = await sendMessageToAI(userMessage);
		await interaction.editReply(aiResponse);
	},
};
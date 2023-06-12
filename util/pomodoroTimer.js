const { EmbedBuilder } = require('discord.js');

const pomodoroTimer = {
	isRunning: false,
	timerInterval: null,
	currentTime: 0,
	timerMessage: null,
	focusflag: true,

	startTimer: async function(interaction, focusMinutes, breakMinutes) {
		if (!this.isRunning) {
			this.currentTime = focusMinutes * 60;
			const timerEmbed = new EmbedBuilder()
				.setTitle('Pomodoro Timer')
				.setDescription(`Focus time: ${focusMinutes} minutes`)
				.addFields([{ name:'Time Remaining', value:this.formatTime(this.currentTime), inline:true }]);
			this.timerMessage = await interaction.channel.send({ embeds: [timerEmbed] });
		}
		this.isRunning = true;

		this.timerInterval = setInterval(() => {
			this.currentTime--;
			const timerEmbed = new EmbedBuilder()
				.setTitle('Pomodoro Timer');

			if (this.currentTime <= 0) {
				this.focusflag = !this.focusflag;
				if (this.isRunning && this.focusflag) {
					this.currentTime = focusMinutes * 60;
				}
				else {
					this.currentTime = breakMinutes * 60;
				}
			}

			const focusMinutesText = focusMinutes === 1 ? 'minute' : 'minutes';
			const breakMinutesText = breakMinutes === 1 ? 'minute' : 'minutes';
			if (this.focusflag) {
				timerEmbed.setDescription(`Focus time: ${focusMinutes} ${focusMinutesText}`);
			}
			else {
				timerEmbed.setDescription(`Break Time: ${breakMinutes} ${breakMinutesText}`);
			}

			timerEmbed.addFields([{ name:'Time Remaining', value:this.formatTime(this.currentTime), inline:true }]);
			this.timerMessage.edit({ embeds: [timerEmbed] });

		}, 1000);
	},

	stopTimer: function(interaction) {
		if (this.isRunning) {
			this.isRunning = false;
			clearInterval(this.timerInterval);
			const stopEmbed = new EmbedBuilder()
				.setTitle('Pomodoro Timer')
				.setDescription('Stopped the Pomodoro session.');
			interaction.channel.send({ embeds: [stopEmbed] });
		}
		else {
			const noSessionEmbed = new EmbedBuilder()
				.setTitle('Pomodoro Timer')
				.setDescription('There is no active Pomodoro session.');
			interaction.channel.send({ embeds: [noSessionEmbed] });
		}
	},

	setTimer: async function(seconds) {
		return new Promise(resolve => {
			setTimeout(resolve, seconds * 1000);
		});
	},

	formatTime: function(seconds) {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
	},
};

module.exports = { pomodoroTimer };
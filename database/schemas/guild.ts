import { Schema } from "mongoose";

export default new Schema({
	_id: {
		type: String,
	},
	prefix: {
		type: String,
		default: "!",
	},
	osu: {
		type: Object,
		default: {
			embeds: {
				beatmap: true,
				user: true,
				discussion: true,
			},
		},
	},
	channels: {
		type: Object,
		default: {
			join: undefined,
			leave: undefined,
			logs: undefined,
		},
	},
	messages: {
		type: Object,
		default: {
			join: {
				content: "",
				embeds: [
					{
						author: {
							name: "Welcome {username}! 👋",
							icon: "{user_avatar}",
							colour: "#37afc6",
						},
						description: "Welcome to the server {username}",
					},
				],
			},
			leave: {
				content: "",
				embeds: [
					{
						author: {
							name: "Oh no, bye {username}!",
							icon: "{user_avatar}",
							colour: "#37afc6",
						},
						description: "Oh, {username} has left the server...",
					},
				],
			},
		},
	},
	autorole: {
		users: [],
		bot: [],
	},
});

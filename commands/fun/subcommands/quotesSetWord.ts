import { Message } from "discord.js";
import * as database from "../../../database";
import createNewGuild from "../../../database/utils/createNewGuild";

export const config = {
	name: "set word",
	description: "Set quotes custom trigger word",
	syntax: "!quotes `set` `word` `<new word>`",
};

export async function run(message: Message, word: string) {
	if (!word) return message.channel.send(":x: Provide a valid trigger word.");

	let guild = await database.guilds.findById(message.guildId);

	if (!message.guild) return;

	if (!guild) guild = await createNewGuild(message.guild);

	guild.fun.enable = true;
	guild.fun.word = word.toUpperCase();

	await database.guilds.updateOne(
		{ _id: message.guildId },
		{
			fun: guild.fun,
		}
	);

	message.channel.send(`✅ Trigger word changed to \`${word}\``);
}

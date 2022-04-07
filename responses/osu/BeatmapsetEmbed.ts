import {
	Message,
	MessageActionRow,
	MessageButton,
	MessageEmbed,
	ReactionCollector,
} from "discord.js";
import calculateTaikoBeatmap from "../../helpers/osu/performance/calculateTaikoBeatmap";
import getEmoji from "../../helpers/text/getEmoji";
import { Beatmap, Beatmapset } from "../../types/beatmap";
import axios from "axios";
import osuApi from "../../helpers/osu/fetcher/osuApi";
import timeString from "../../helpers/text/timeString";
import calculateOsuBeatmap from "../../helpers/osu/performance/calculateOsuBeatmap";
import calculateFruitsBeatmap from "../../helpers/osu/performance/calculateFruitsBeatmap";
import calculateManiaBeatmap from "../../helpers/osu/performance/calculateManiaBeatmap";
import storeBeatmap from "../../helpers/osu/fetcher/general/storeBeatmap";
import getBeatmapEmbedFields from "../../helpers/text/embeds/getBeatmapEmbedFields";

export default {
	send: async (
		beatmapset: Beatmapset,
		beatmap_id: string,
		mode: "osu" | "taiko" | "mania" | "fruits" | "",
		message: Message
	) => {
		if (!beatmapset.beatmaps) return;
		let index = 0;

		//? Sort diffs by sr
		beatmapset.beatmaps.sort((a, b) => {
			return Number(a.difficulty_rating) - Number(b.difficulty_rating);
		});

		if (beatmap_id != "") {
			const b_index = beatmapset.beatmaps.findIndex(
				(b) => b.id == Number(beatmap_id)
			);

			if (b_index > -1) index = b_index;
		}

		async function generateFor(beatmap: Beatmap) {
			if (!beatmapset.beatmaps)
				return {
					embed: new MessageEmbed(),
					buttons: new MessageActionRow(),
				};

			const map = await axios(`https://osu.ppy.sh/osu/${beatmap.id}`);
			const mapper = await osuApi.fetch.user(beatmap.user_id.toString());

			if (mapper.status != 200) mapper.data.username = "---";

			let performance;
			let pps = "";

			switch (beatmap.mode) {
				case "taiko": {
					performance = calculateTaikoBeatmap(map.data);

					break;
				}
				case "osu": {
					performance = calculateOsuBeatmap(map.data);

					break;
				}
				case "fruits": {
					performance = calculateFruitsBeatmap(map.data);

					break;
				}
				case "mania": {
					performance = calculateManiaBeatmap(map.data);

					break;
				}
			}

			performance.forEach((p: any) => {
				pps = pps.concat(
					`${p.acc ? `${p.acc}%` : p.score} \`${p.pp}pp\` `
				);
			});

			const status_icons: any = {
				ranked: "https://media.discordapp.net/attachments/959908232736952420/961628150398337105/ranked.png",
				loved: "https://cdn.discordapp.com/attachments/959908232736952420/961628149874053240/loved.png",
				approved:
					"https://cdn.discordapp.com/attachments/959908232736952420/961628149555273808/qualified.png",
				pending:
					"https://media.discordapp.net/attachments/959908232736952420/961628150608044082/pending.png",
				wip: "https://media.discordapp.net/attachments/959908232736952420/961628150608044082/pending.png",
				graveyard:
					"https://media.discordapp.net/attachments/959908232736952420/961628150608044082/pending.png",
			};

			const embed = new MessageEmbed({
				title: `${beatmapset.artist} - ${beatmapset.title}`,
				url: `https://osu.ppy.sh/s/${beatmapset.id}`,
				fields: [
					{
						name: `${getEmoji(beatmap.mode)} ${beatmap.version}`,
						value: getBeatmapEmbedFields(
							beatmap,
							beatmap.mode,
							map.data
						),
					},
					{
						name: "PP Values",
						value: pps,
					},
				],
				thumbnail: {
					url: `https://b.ppy.sh/thumb/${beatmapset.id}l.jpg`,
				},
				author: {
					name: `Difficulty ${index + 1} of ${
						beatmapset.beatmaps.length
					}`,
					iconURL: status_icons[beatmap.status],
				},
				color: "#f45592",
				footer: {
					text: `Mapped by ${mapper.data.username} | ${beatmapset.status}`,
					iconURL: mapper.data.avatar_url,
				},
			});

			if (!embed.description)
				return {
					embed,
					buttons,
				};

			return {
				embed,
				buttons,
			};
		}

		const buttons = new MessageActionRow();
		buttons.addComponents([
			new MessageButton({
				type: "BUTTON",
				style: "LINK",
				url: `https://osu.ppy.sh/s/${beatmapset.id}`,
				label: "Beatmap Page",
			}),
			new MessageButton({
				type: "BUTTON",
				style: "LINK",
				url: `https://osu.ppy.sh/users/${beatmapset.user_id}`,
				label: "Mapper Profile",
			}),
		]);

		const beatmap_file = await osuApi.download.beatmapset(
			beatmapset.id.toString()
		);

		const stored_file = await storeBeatmap(
			beatmap_file,
			beatmapset,
			message
		);

		if (!stored_file.big) {
			buttons.addComponents([
				new MessageButton({
					type: "BUTTON",
					style: "LINK",
					url: stored_file.url,
					label: "Download Beatmap",
				}),
			]);
		}

		const elements = await generateFor(beatmapset.beatmaps[index]);

		message
			.reply({
				embeds: [elements.embed],
				components: [buttons],
				allowedMentions: {
					repliedUser: false,
				},
			})
			.then((msg) => {
				// ? Add controls
				const reactions = ["⏮", "⏭"];

				reactions.forEach((emoji) => {
					msg.react(emoji);
				});

				const collector = new ReactionCollector(msg, {
					max: 100,
					time: 60000,
					maxUsers: 100,
					idle: 60000,
					filter: (r, u) => {
						if (
							u.id != message.author.id &&
							!reactions.includes(r.emoji.name || "")
						)
							return false;

						return true;
					},
				});

				collector.on("collect", async (r, u) => {
					if (!beatmapset.beatmaps) return;

					if (u.id != message.author.id) return;

					if (r.emoji.name == "⏮" && index > 0) {
						index--;

						const new_components = await generateFor(
							beatmapset.beatmaps[index]
						);

						msg.edit({
							embeds: [new_components.embed],
							components: [new_components.buttons],
							allowedMentions: {
								repliedUser: false,
							},
						});
					}

					if (
						r.emoji.name == "⏭" &&
						index + 1 < beatmapset.beatmaps.length
					) {
						index++;

						const new_components = await generateFor(
							beatmapset.beatmaps[index]
						);

						msg.edit({
							embeds: [new_components.embed],
							components: [new_components.buttons],
							allowedMentions: {
								repliedUser: false,
							},
						});
					}
				});

				collector.on("remove", async (r, u) => {
					if (!beatmapset.beatmaps) return;

					if (u.id != message.author.id) return;

					if (r.emoji.name == "⏮" && index > 0) {
						index--;

						const new_components = await generateFor(
							beatmapset.beatmaps[index]
						);

						msg.edit({
							embeds: [new_components.embed],
							components: [new_components.buttons],
							allowedMentions: {
								repliedUser: false,
							},
						});
					}

					if (
						r.emoji.name == "⏭" &&
						index + 1 < beatmapset.beatmaps.length
					) {
						index++;

						const new_components = await generateFor(
							beatmapset.beatmaps[index]
						);

						msg.edit({
							embeds: [new_components.embed],
							components: [new_components.buttons],
							allowedMentions: {
								repliedUser: false,
							},
						});
					}
				});
			});
	},
};

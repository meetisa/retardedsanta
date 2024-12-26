import Bot from './botfuncs.js';
import { commands, states } from './commands.js';

const DEV_CHAT_ID = 512131924;
const DEV_MODE = false;

let state = '';
let stateData = '';

export default {
	async fetch(request, env, ctx) {
		if(request.method == "POST") {
			const update = await request.json();

			let bot = new Bot(env.API_KEY, update);

			if('message' in update) {

				if(DEV_MODE && bot.chatId != DEV_CHAT_ID) {
					await bot.sendMessage("Lavori in corso, sorry");
					return new Response('DEV_MODE');
				}

				if(bot.input[0] == '/')
					await this.commandManagement(env, bot);
				else
					await this.stateManagement(env, bot);
			}
		}

		return new Response('OK');
	},

	async commandManagement(env, bot) {
		if(commands[bot.command].onlydevs && bot.chatId != DEV_CHAT_ID) {
			await bot.sendMessage("azione riservata agli sviluppatori, sorry");
			return;
		}

		let resp = await commands[bot.command].exec(env, bot);
		if(resp != undefined)
			[state, stateData] = resp;
	},

	async stateManagement(env, bot) {
		if(state != '')
			state = await states[state](env, bot, stateData);
		else
			await bot.sendMessage(await env.MODBEST.bestemmiaRandom());
	}
};

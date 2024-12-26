import Bot from './botfuncs.js';
import { commands, states } from './commands.js';

const DEV_CHAT_ID = 512131924;
const DEV_MODE = false;

const filename = 'data.json';

let newgroup = false;
let setpw = false;
let state = '';
let groupName = '';
let joinName = '';
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
					await this.commandManagement(env, bot, bot.command, bot.args);
				else
					await this.stateManagement(env, bot, update, bot.input);
			}
		}

		return new Response('OK');
	},

	async getData(bucket) {
		var t = await bucket.get(filename);
		t = await t.text();
		return JSON.parse(t);
	},

	async commandManagement(env, bot, command, args) {
		let resp = await commands[command].exec(env, bot);
		if(resp != undefined)
			[state, stateData] = resp;
	},

	async stateManagement(env, bot, update, text) {

		if(state != '')
			state = await states[state](env, bot, stateData);
		else
			await bot.sendMessage(await env.MODBEST.bestemmiaRandom());
		return;


		switch(state) {
			case 'setpw':
				var t = await this.getData(env.DATA);

				let group = new Object();
				group.password = text;
				group.people = new Object();
				group.people[update.message.chat.id] = this.createPerson(update, "true");

				t.groups[stateData] = group;

				await env.DATA.put(filename, JSON.stringify(t));
				await bot.sendMessage("fatto");
				state = '';
			break;

			case 'join':
				if(await this.checkPassword(env, bot, stateData, text)) {
					var t = await this.getData(env.DATA);
					t.groups[stateData].people[update.message.chat.id] = this.createPerson(update, "false");
					await env.DATA.put(filename, JSON.stringify(t));
					await bot.sendMessage("fatto");
				}
				state = '';
			break;

			default:
				await bot.sendMessage(await env.MODBEST.bestemmiaRandom());
			break;
		}
	},

	async checkPassword(env, bot, name, password) {
		var t = await this.getData(env.DATA);
		var result = ( t.groups[name].password == password );
		await bot.sendMessage("Password " + (result ? "esatta" : "errata"));
		return result;
	},

	createPerson(request, isAdmin) {
		return {
			username: request.message.chat.username,
			first_name: request.message.chat.first_name,
			last_name: request.message.chat.last_name,
			admin: isAdmin
		};
	}
};

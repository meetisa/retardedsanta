import Bot from './botfuncs.js';
import { commands } from './commands.js';

const DEV_CHAT_ID = 512131924;
const DEV_MODE = false;

const filename = 'data.json';

let desc_com = "/start - mi presento%0A";
desc_com += "/commands - stai vedendo adesso cosa fa questo comando, autoesplicativo%0A";
desc_com += "/newgroup [nome] - crea un nuovo gruppo con cui scambiare i regali%0A";
desc_com += "/join [nome] - per aggiungersi a un gruppo già esistene (bisogna sapere la password)%0A";
desc_com += "/extract [nome] - estrae dal gruppo i nomi casuali, e manda un messaggio a tutti i partecipanti (bisgna essere il creatore del gruppo)%0A";
desc_com += "/print [nome] - stampa tutti i partecipanti del gruppo, funziona solo se si fa parte del gruppo%0A";

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
		return;

		switch(command) {
			//fatto
			case "/start":
				await bot.sendMessage("OH! OH! OH! (sono ritardato)");
				await bot.sendMessage("/commands per sfruttarmi");
			break;

			//fatto
			case "/commands":
				await bot.sendMessage(desc_com);
			break;

			//fatto
			case "/newgroup":
				if(args[0] == undefined || args[0] == '') {
					await bot.sendMessage("devi mettere il nome del gruppo dopo il comando, merda");
				}
				else {
					await bot.sendMessage(`nuovo gruppo aggiunto: ${args[0]}`);
					groupName = args[0];
					stateData = args[0];
					state = 'setpw';
					await bot.sendMessage(`scegli una password per il gruppo`);
				}
			break;

			//fatto
			case "/join":
				state = 'join';
				joinName = args[0];
				await bot.sendMessage(`Qual è la password del gruppo ${args[0]}?`);
			break;

			//fatto
			case "/reset":
				await env.DATA.put(filename, '{"groups":{}}');
				await bot.sendMessage("fatto");
			break;

			//fatto
			case "/printdata":
				var t = await this.getData(env.DATA);
				await bot.sendMessage(JSON.stringify(t, null, 4));
			break;

			//fatto
			case "/print":
				var t = await this.getData(env.DATA);
				if(t.groups.hasOwnProperty(args[0]))
					await bot.sendMessage(Object.values(t.groups[args[0]].people).map(x => x["username"]).join("%0A"));
				else
					await bot.sendMessage("gruppo non conosciuto");
			break;

			//fatto
			case "/extract":
				var t = await this.getData(env.DATA);
				var grp = t.groups[args[0]].people;
				var people = Object.keys(grp).map(id => [id, grp[id]]);
				var i;
				if(t.groups.hasOwnProperty(args[0])) {
					people.sort((a,b) => 0.5 - Math.random());

					for(i=0; i<people.length; i++) {
						var j;
						if(i == people.length-1)
							j = 0;
						else
							j = i+1;
						var alice = people[i][0];
						var bob = people[j][1].first_name;
						if(people[j][1].hasOwnProperty("last_name"))
							bob += " " + people[j][1].last_name;
						await bot.sendToAnyMessage(alice, `Dovrai fare il regalo a <span class="tg-spoiler">${bob}</span>`);
					}
				}
				else
					await bot.sendMessage("gruppo non conosciuto");
			break;

			//fatto
			case "/allgroups":
				var t = await this.getData(env.DATA);
				await bot.sendMessage(Object.keys(t.groups).join("%0A"));
			break;
		}
	},

	async stateManagement(env, bot, update, text) {
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

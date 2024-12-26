export const commands = {
	"/printdata": {
		"description": "",
		"onlydevs": true,
		"exec": async (env, bot) => {
			let data = await getData(env);
			await bot.sendMessage(JSON.stringify(data));
		}
	},

	"/reset": {
		"description": "",
		"onlydevs": true,
		"exec": async (env, bot) => {
			await env.DATA.put(env.FILENAME, '{"groups":{}}');
			await bot.sendMessage("fatto");
		}
	},

	"/specs": {
		"description": "",
		"onlydevs": true,
		"exec": async (env, bot) => {
			await bot.sendMessage(JSON.stringify(bot.request));
		}
	},


	"/start": {
		"description": "/start - mi presento",
		"onlydevs": false,
		"exec": async (env, bot) => {
			await bot.sendMessage("OH! OH! OH! (sono ritardato)");
			await bot.sendMessage("/commands per sfruttarmi");
		}
	},

	"/commands": {
		"description": "/commands - stai vedendo adesso cosa fa questo comando, autoesplicativo",
		"onlydevs": false,
		"exec": async (env, bot) => {
			await bot.sendMessage(allDescriptions().join("%0A%0A"));
		}
	},

	"/newgroup": {
		"description": "/newgroup [nome] - crea un nuovo gruppo con cui scambiare i regali",
		"onlydevs": false,
		"exec": async (env, bot) => {
			if(bot.args[0] == undefined || bot.args[0] == '')
				await bot.sendMessage("devi mettere il nome del gruppo dopo il comando, merda");
			else {
				await bot.sendMessage(`nuovo gruppo aggiunto: ${bot.args[0]}`);
				await bot.sendMessage(`scegli una password per il gruppo`);
			}
			return ["setpw", bot.args[0]];
		}
	},

	"/join": {
		"description": "/join [nome] - per aggiungersi a un gruppo già esistene (bisogna sapere la password)",
		"onlydevs": false,
		"exec": async (env, bot) => {
			await bot.sendMessage(`Qual è la password del gruppo ${bot.args[0]}?`);
			return ['join', bot.args[0]];
		}
	},

	"/extract": {
		"description": "/extract [nome] - estrae dal gruppo i nomi casuali, e manda un messaggio a tutti i partecipanti (bisgna essere il creatore del gruppo)",
		"onlydevs": false,
		"exec": async (env, bot) => {
			let data = await getData(env);

			let grp = data.groups[bot.args[0]].people;
			let people = Object.key(grp).map(id => [id, grp[id]]);
			var i, j;
			var alice, bob;

			if(data.groups.hasOwnProperty(bot.args[0])) {
				people.sort((a,b) => 0.5 - Math.random());
				for(i=0; i<people.length; i++) {
					if(i == people.length-1)
						j = 0;
					else
						j = i+1;

					alice = people[i][0];
					bob = people[j][1].first_name;
					if(people[j][1].hasOwnProperty("last_name"))
						bob += " " + people[j][1].last_name;

					await bot.sendToAnyMessage(alice, `Dovrai fare il regalo a <span class="tg-spoiler">${bob}</span>`);
				}
			}
			else
				await bot.sendMessage("gruppo inesistente");
		}
	},

	"/allgroups": {
		"description": "/allgroups - stampa tutti i gruppi esistenti in questo bot",
		"onlydevs": false,
		"exec": async (env, bot) => {
			let data = await getData(env);
			await bot.sendMessage(Object.keys(data.groups).join("%0A"));
		}
	},

	"/print": {
		"description": "/print [nome] - stampa tutti i partecipanti del gruppo, funziona solo se si fa parte del gruppo",
		"onlydevs": false,
		"exec": async (env, bot) => {
			let data = await getData(env);

			if(data.groups.hasOwnProperty(bot.args[0])) {
				let people = data.groups[bot.args[0]].people;
				if(Object.keys(people).includes(String(bot.chatId)))
					await bot.sendMessage(Object.values(people).map(x => x.username).join("%0A"));
				else
					await bot.sendMessage("non fai parte del gruppo, idiota");
			}
			else
				await bot.sendMessage("gruppo inesistente");
		}
	}
};

export const states = {
	"setpw": async (env, bot, stateData) => {
		let data = await getData(env);

		let group = new Object();
		group.password = bot.input;

		group.people = new Object();
		group.people[bot.chatId] = bot.createPerson("true");

		data.groups[stateData] = group;

		await env.DATA.put(env.FILENAME, JSON.stringify(data));
		await bot.sendMessage("fatto");

		return '';
	},

	"join": async (env, bot, stateData) => {
		if(await checkpw(env, bot, stateData, bot.input)) {
			let data = await getData(env);
			data.groups[stateData].people[String(bot.chatId)] = bot.createPerson("false");
			await env.DATA.put(env.FILENAME, JSON.stringify(data));
			await bot.sendMessage("fatto");
		}

		return '';
	}
};

function allDescriptions() {
	return Object.values(commands).map(c => c.description);
}

async function getData(env) {
	return JSON.parse(
		await (
			await env.DATA.get(env.FILENAME)
		).text()
	);
}

async function checkpw(env, bot, name, pw) {
	let data = await getData(env);
	let check = ( data.groups[name].password == pw );

	await bot.sendMessage("password " + (check ? "esatta" : "errata"));
	return check;
}

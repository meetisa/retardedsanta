export const commands = {
	/* comandi riservati agli sviluppatori */
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

	/* ---------------------------------- */


	/* comandi per tutti gli utenti */

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
			let newname = bot.args[0];

			//controllo che il nome sia valido
			if(newname == undefined || newname == '') {
				await bot.sendMessage("devi mettere il nome del gruppo dopo il comando, merda");
				return;
			}

			//controllo che il gruppo non esista già
			let data = await getData(env);
			if(data.groups.hasOwnProperty(newname)) {
				await bot.sendMessage("un gruppo con questo nome esiste già, scegline un altro per dio");
				return;
			}

			await bot.sendMessage(`nuovo gruppo aggiunto: ${newname}`);
			await bot.sendMessage(`scegli una password per il gruppo`);
			return ["setpw", newname];
		}
	},

	"/delete": {
		"description": "/delete [nome] - elimina per sempre il gruppo (bisogna essere admin + sapere la password)",
		"onlydevs": false,
		"exec": async (env, bot) => {
			let data = await getData(env);
			let grpName = bot.args[0];

			if(!data.groups.hasOwnProperty(grpName)) {
				await bot.sendMessage("gruppo inesistente");
				return;
			}

			if(data.groups[grpName].people[bot.chatId].admin == "false") {
				await bot.sendMessage("solo l'admin può eliminare il gruppo, sorry");
				return;
			}

			await bot.sendMessage("sei sicuro di voler eliminare il gruppo?");
			await bot.sendMessage("per sicurezza, dimmi la password del gruppo e poi lo distruggo");
			return ["delgrp", grpName];
		}
	},

	"/setadmin": {
		"description": "/setadmin [username] [gruppo] - per rendere un partecipante del gruppo un admin (bisogna essere admin)",
		"onlydevs": false,
		"exec": async (env, bot) => {
			let data = await getData(env);
			let newadmin = bot.args[0];
			let grpName = bot.args[1];

			if(!data.groups.hasOwnProperty(grpName)) {
				await bot.sendMessage("gruppo inesistente");
				return;
			}

			let grp = data.groups[grpName].people;

			if(grp[bot.chatId].admin == "false") {
				await bot.sendMessage("solo gli admin possono rendere altri admin, sorry");
				return;
			}

			if(!Object.values(grp).map(p => p.username).includes(newadmin)) {
				await bot.sendMessage(`${newadmin} non fa parte del gruppo ${grpName}, idiota`);
				return;
			}


			Object.keys(grp).forEach(id => {
				if(grp[id].username == newadmin)
					data.groups[grpName].people[id].admin = "true";
			});

			await env.DATA.put(env.FILENAME, JSON.stringify(data));
			await bot.sendMessage("fatto");
		}
	},

	"/join": {
		"description": "/join [nome] - per aggiungersi a un gruppo già esistene (bisogna sapere la password)",
		"onlydevs": false,
		"exec": async (env, bot) => {
			let data = await getData(env);
			let grpName = bot.args[0];

			if(!data.groups.hasOwnProperty(grpName)) {
				await bot.sendMessage("gruppo inesistente");
				return;
			}

			if(data.groups[grpName].people.hasOwnProperty(bot.chatId)) {
				await bot.sendMessage("fai già parte del gruppo, idiota");
				return;
			}

			await bot.sendMessage(`Qual è la password del gruppo ${grpName}?`);
			return ['join', grpName];
		}
	},

	"/extract": {
		"description": "/extract [nome] - estrae dal gruppo i nomi casuali, e manda un messaggio a tutti i partecipanti (bisgna essere il creatore del gruppo)",
		"onlydevs": false,
		"exec": async (env, bot) => {
			let a, alice, b, bob;

			let data = await getData(env);

			//controllo esistenza gruppo
			if(!data.groups.hasOwnProperty(bot.args[0])) {
				await bot.sendMessage("gruppo inesistente");
				return;
			}

			let grp = data.groups[bot.args[0]].people;

			//controllo che la richiesta sia dell'admin del gruppo
			if(grp[String(bot.chatId)].admin == "false") {
				await bot.sendMessage("Solo l'admin del gruppo può estrarre i nomi, sorry");
				return;
			}

			let people = Object.keys(grp).map(id => [id, grp[id]]);

			people.sort((x, y) => 0.5 - Math.random());

			for(a=0; a<people.length; a++) {
				if(a == people.length-1)
					b = 0;
				else
					b = a+1;

				alice = people[a][0];
				bob = people[b][1].first_name;
				if(people[b][1].hasOwnProperty("last_name"))
					bob += " " + people[b][1].last_name;

				await bot.sendToAnyMessage(alice, `Dovrai fare il regalo a <span class="tg-spoiler">${bob}</span>`);
			}
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

			//controllo esistenza gruppo
			if(!data.groups.hasOwnProperty(bot.args[0])) {
				await bot.sendMessage("gruppo inesistente");
				return;
			}

			//controllo che l'utente faccia parte del gruppo
			let people = data.groups[bot.args[0]].people;
			if(!Object.keys(people).includes(String(bot.chatId))) {
				await bot.sendMessage("non fai parte del gruppo, idiota");
				return;
			}

			await bot.sendMessage(Object.values(people).map(x => x.username).join("%0A"));
		}
	}

	/* ---------------------------------- */
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
	},

	"delgrp": async (env, bot, stateData) => {
		if(await checkpw(env, bot, stateData, bot.input)) {
			let data = await getData(env);
			delete data.groups[stateData];
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

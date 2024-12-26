export const commands = {
	"/printdata": {
		"description": "",
		"onlydevs": true,
		"exec": async (env, bot) => {
			var t = await (await env.DATA.get(bot.filename)).text();
			t = JSON.parse(t);
			await bot.sendMessage(JSON.stringify(t));
		}
	},

	"/reset": {
		"description": "",
		"onlydevs": true,
		"exec": async (env, bot) => {
			await env.DATA.put(bot.filename, '{"groups":{}}');
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
			await bot.sendMessage(allDescriptions().join("%0A"));
		}
	},

	"/newgroup": {
		"description": "/newgroup [nome] - crea un nuovo gruppo con cui scambiare i regali%0A",
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
			var t = await (await env.DATA.get(bot.filename)).text();
			t = JSON.parse(t);

			let grp = t.groups[bot.args[0]].people;
			let people = Object.key(grp).map(id => [id, grp[id]]);
			var i, j;
			var alice, bob;

			if(t.groups.hasOwnProperty(bot.args[0])) {
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
			var t = await (await env.DATA.get(bot.filename)).text();
			t = JSON.parse(t);
			await bot.sendMessage(Object.keys(t.groups).join("%0A"));
		}
	},

	"/print": {
		"description": "/print [nome] - stampa tutti i partecipanti del gruppo, funziona solo se si fa parte del gruppo",
		"onlydevs": false,
		"exec": async (env, bot) => {
			var t = await (await env.DATA.get(bot.filename)).text();
			t = JSON.parse(t);

			if(t.groups.hasOwnProperty(bot.args[0])) {
				let people = t.groups[args[0]].people;
				if(bot.chatId in Object.keys(people))
					await bot.sendMessage(Object.values(people).map(x => x.username).join("%0A"));
				else
					await bot.sendMessage("non fai parte del gruppo, idiota");
			}
			else
				await bot.sendMessage("gruppo inesistente");
		}
	}
};

function allDescriptions() {
	return Object.values(commands).map(c => c.description);
}

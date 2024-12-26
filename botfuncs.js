export default class Bot {
	constructor(API_KEY, request) {
		this.filename = "data.json";

		this.API_KEY = API_KEY;
		this.url = `https://api.telegram.org/bot${API_KEY}/`;
		this.chatId = request.message.chat.id
		this.request = request;

		this.input = String(request.message.text);

		let parsed = this.input.trim().split(/\s+/);
		this.command = parsed[0];
		this.args = parsed.slice(1);
	}

	/** *
	 * @param {String} API_KEY - the bot token
	 * @param {Number} chatId - the id of the chat
	 * @param {String} text - the content of the message
	 */
	async sendMessage(text) {
		let url = this.url + `sendMessage?chat_id=${this.chatId}&parse_mode=HTML&text=${text}`;
		return await fetch(url).then(resp => resp.json());
	}

	async sendToAnyMessage(chatId, text) {
		let url = this.url + `sendMessage?chat_id=${chatId}&parse_mode=HTML&text=${text}`;
		return await fetch(url).then(resp => resp.json());
	}

	/**
	 *
	 * @param {String} API_KEY - the bot token
	 * @param {Number} chatId - the id of the chat
	 * @param {String} text - the content of the message
	 * @param {Object} keyboard - the inline keyboard
	 */
	async sendKeyboard(API_KEY, chatId, text, keyboard) {
		let url = `https://api.telegram.org/bot${API_KEY}/sendMessage?chat_id=${chatId}&text=${text}&reply_markup=${JSON.stringify(keyboard)}`;
		return await fetch(url).then(resp => resp.json());
	}

	/**
	 *
	 * @param {String} API_KEY - the bot token
	 * @param {Number} chatId - the id of the chat
	 * @param {Number} messageId - the id of the message
	 * @param {String} text - the new content of the message
	 * @param {Object} keyboard - the new inline keyboard
	 */
	async editMessageText(API_KEY, chatId, messageId, text, keyboard={}) {
		let url = `https://api.telegram.org/bot${API_KEY}/editMessageText?chat_id=${chatId}&message_id=${messageId}&text=${text}&reply_markup=${JSON.stringify(keyboard)}`;
		return await fetch(url).then(resp => resp.json());
	}
}

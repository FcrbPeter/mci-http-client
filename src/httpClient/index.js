const axios = require('axios')
const {HttpsProxyAgent} = require("hpagent");

class HttpClient {
	#clientBase
	#onApiStart = []
	#onApiEnd = []
	#onApiError = []

	constructor(axiosOptions = {}, agentOptions = null) {
		const httpsAgent = agentOptions ? new HttpsProxyAgent(agentOptions) : null;

		// axiosOptions.validateStatus = () => true

		this.#clientBase = axios.create({
			httpsAgent,
			...axiosOptions
		})
	}

	async get(path, options) {
		return this.#executeApi(() => this.#clientBase.get(path, options))
	}

	async post(path, data, options) {
		return this.#executeApi(() => this.#clientBase.post(path, data, options))
	}

	async put(path, data, options) {
		return this.#executeApi(() => this.#clientBase.put(path, data, options))
	}

	async delete(path, options) {
		return this.#executeApi(() => this.#clientBase.delete(path, options))
	}

	async #executeApi(apiCall, retryTimes = 3, retryDelay = 300) {
		let result = null;
		let error = null;

		this.#notifyApiStart()

		try {
			result = await apiCall();

			if (result) {
				this.#notifyApiEnd()
				return result;
			}
		} catch (e) {
			error = e;
		}

		let retry = 0;

		while (retry < retryTimes) {
			await new Promise((resolve) => setTimeout(resolve, retryDelay));

			try {
				result = await apiCall();

				if (result) {
					this.#notifyApiEnd()
					return result;
				}
			} catch (e) {
				error = e;
			}

			retry++;
		}

		if (error) {
			this.#notifyApiError()
			throw error;
		}

		this.#notifyApiEnd()
	}

	addOnApiStart(fn) {
		this.#onApiStart.push(fn)
	}

	#notifyApiStart() {
		this.#onApiStart.forEach((fn) => fn ? fn() : null)
	}

	addOnApiEnd(fn) {
		this.#onApiEnd.push(fn)
	}

	#notifyApiEnd() {
		this.#onApiEnd.forEach((fn) => fn ? fn() : null)
	}

	addOnApiError(fn) {
		this.#onApiError.push(fn)
	}

	#notifyApiError() {
		this.#onApiError.forEach((fn) => fn ? fn() : null)
	}
}

module.exports = HttpClient

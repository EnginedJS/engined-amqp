const EventEmitter = require('events');
const amqplib = require('amqplib');
const { Service } = require('engined');

class AMQPAgent extends EventEmitter {
	constructor() {
		super();

		this.uri = null;
		this.caCert = null;
		this.connection = null;
		this.channel = null;
		this.retry = 3;
	}

	isConnected() {
		return this.connection ? true : false;
	}

	_delay(interval) {

		return new Promise((resolve) => {

			setTimeout(resolve, interval);
		});
	}

	async _reconnect(num) {

		if (num == 0)
			throw new Error('Failed to connect to', this.uri);

		let ret = await this._connect();
		if (!ret) {
			await this._delay(1000);

			console.log('Reconnect to AMQP server', this.uri);
			await this._reconnect(num - 1);
		}
	}

	async _connect() {

		let opts = {};

		if (this.caCert) {
			opts.ca = [ this.caCert ];
		}

		// Connect to AMQP server
		try {
			let connection = this.connection = await amqplib.connect(this.uri, opts)

			console.log('Connected AMQP server', this.uri);

			connection.once('error', async (err) => {

				this.emit('error', err);

				this.connection = null;

				try {
					await this._reconnect(this.retry);
				} catch(e) {
					this.emit('error', e);
				}
			});

			connection.once('close', () => {
				this.connection = null;
			});

			this.emit('connected');

			return true;
		} catch(e) {
			console.error(e);
		}

		return false;
	}

	async connect(uri, ca) {

		if (ca !== undefined) {
			this.caCert = new Buffer(ca, 'base64');
		}

		this.uri = uri;

		await this._reconnect(this.retry);
	}

	async disconnect() {

		if (!this.connection)
			return;

		this.connection.close();
	}

	async getChannel() {

		if (!this.connection) {
			await this._reconnect(this.retry);

			this.channel = await this.connection.createChannel();
		}

		if (!this.channel)
			this.channel = await this.connection.createChannel();

		return this.channel;
	}
}

module.exports = class extends require('engined').Service {

	constructor(ctx) {
		super(ctx);

		this.agents = [];
	}

	async start() {

		// Register to context
		this.getContext().set('AMQP', {
			createAgent: async (name = 'default') => {
				let agent = new AMQPAgent();

				this.agents.push({
					instance: agent
				});

				return agent;
			},
			releaseAgent: async (name = 'default') => {

				for (let index in this.agents) {
					let agentInfo = this.agents[index];

					// Find by name
					if (agentInfo.name === name) {
						await agnetInfo.instance.disconnect();
						this.agents.splice(index, 1);
						return;
					}

					// Find by agent object
					if (agentInfo.instance === name) {
						await agnetInfo.instance.disconnect();
						this.agents.splice(index, 1);
						return;
					}
				}
			}
		});
	}

	async stop() {

		// Close connections
		for (let index in this.agents) {
			await this.agents[index].instance.disconnect();
		}
	}
};

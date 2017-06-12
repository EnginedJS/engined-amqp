# engined-amqp

AMQP agent service for engined, which is based on `amqplib`.

[![NPM](https://nodei.co/npm/engined-amqp.png)](https://nodei.co/npm/engined-amqp/)

## Installation

Install via NPM:

```
npm install engined-amqp
```

## Usage

You must start AMQP agent service in engined, see example below:

```javascript
const { Manager } = require('engined');
const AMQPAgent = require('engined-amqp');

const main = async () => {

	// Create manager
	let serviceManager = new Manager({ verbose: true });

	// Adding agent to manager
	serviceManager.add('AMQPAgent', AMQPAgent);

	// Start all services
	await serviceManager.startAll();
};

main();
```

APIs for managing AMQP agent are registered after starting service. Now you can create AMQP agent to connect to server for your propose by using provided APIs.

```javascript

// Create a new agent for AMQP
let agent = this.getContext('AMQPAgent').createAgent('myAMQP');

// Connect with AMQP URI
let await agent.connect('amqp://localhost/myvhost');

// Get channel for AMQP connection
let channel = agent.getChannel();

// channel is provided by amqplib ...
```

## License
Licensed under the MIT License
 
## Authors
Copyright(c) 2017 Fred Chien（錢逢祥） <<cfsghost@gmail.com>>

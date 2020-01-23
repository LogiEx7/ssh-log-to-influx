import parser from './parser'
import geohash from './geohash'
import log4js from 'log4js'
import net from 'net';

let logger = log4js.getLogger();
logger.level = 'debug';

const Influx = require('influx');
// InfluxDB Initialization.
const influx = new Influx.InfluxDB({
	host: process.env.INFLUX_URL || '127.0.0.1',
	database: process.env.INFLUX_DB || 'influx'
});

const port = process.env.PORT || 7070;
const host = '0.0.0.0';

const server = net.createServer();

server.on('connection', (socket) => {

	logger.info(`CONNECTED: ${socket.remoteAddress}:${socket.remotePort}`)

	socket.on('data', async (data) => {
		
		socket.destroy();

		logger.debug('Received data', data.toString())

		const {ip, port, username} = parser(data.toString())
		logger.debug(`Parsed ${username} ${ip}:${port}`)

		const {geohash: geohashed, location} = await geohash(ip);
		logger.debug(`Geohashed ${username} ${ip}:${port}`)
		influx.writePoints([
			{
				measurement: 'geossh',
				fields: {
					value: 1
				},
				tags: {
					geohash: geohashed,
					username,
					port,
					ip,
					location
				}
			}
		]);

	})

	socket.on('close', () => {
		logger.info(`CLOSED: ${socket.remoteAddress}:${socket.remotePort}`)
	});
});

server.listen(port, host, () => {
	logger.info(`TCP Server is running on port ${port}.`);
});
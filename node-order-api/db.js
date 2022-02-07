async function connect() {
	if (global.connection && global.connection.state !== 'disconnected')
		return global.connection;

	const mysql = require("mysql2/promise");
	const connection = await mysql.createConnection({
		host: process.env.DB_HOST || 'localhost',
		port: 3306,
		user: 'test',
		password: 'test',
		database: 'finalProject',
		multipleStatements: true
	});
	console.log("Conectou no MySQL!");
	global.connection = connection;
	return connection;
}

async function getAllOrders() {
	try {
		const connection = await connect();

		const query = `SELECT * FROM orders LIMIT 1000;`;
		console.log(`Executando query: ${query}`);

		const [rows, fields] = await connection.execute(query);
		console.log(`Rows: ${JSON.stringify(rows)}`);
		return rows;
	} catch (err) {
		console.log("Erro SQL: " + err);
		throw { code: 500, message: 'Erro inesperado ao buscar os pedidos' };
	}
}

async function getOrderById(id) {
	try {
		const connection = await connect();

		// const query = `SELECT * FROM orders WHERE id = "${id}";`;
		const query = `SELECT * FROM orders WHERE id = ?;`;
		console.log(`Executando query: ${query}`);

		const [rows, fields] = await connection.execute(query, [id]);

		return rows;
	} catch (err) {
		console.log("Erro SQL: " + err);
		throw { code: 500, message: 'Erro inesperado ao buscar pedido' };
	}
}

async function getOrderByClientId(id) {
	try {
		const connection = await connect();

		// const query = `SELECT * FROM orders WHERE client_id = "${id}";`;
		const query = `SELECT * FROM orders WHERE client_id = ?;`;
		console.log(`Executando query: ${query}`);

		const [rows, fields] = await connection.execute(query, [id]);

		return rows;
	} catch (err) {
		console.log("Erro SQL: " + err);
		throw { code: 500, message: 'Erro inesperado ao buscar pedido' };
	}
}

async function updateOrderById(id, clientId, productId, amount) {
	try {
		const connection = await connect();

		// const query = `UPDATE orders SET client_id = "${clientId}", product_id = "${productId}", amount = ${amount} WHERE id = "${id}";`;
		const query = `UPDATE orders SET client_id = ?, product_id = ?, amount = ? WHERE id = ?;`;
		console.log(`Executando query: ${query}`);

		const [rows] = await connection.execute(query, [clientId, productId, amount, id]);
		return rows;
	} catch (err) {
		throw { code: 500, message: 'Erro inesperado ao atualizar pedido' };
	}
}

async function deleteOrderById(id) {
	try {
		const connection = await connect();

		// const query = `DELETE FROM orders WHERE id = "${id}";`;
		const query = `DELETE FROM orders WHERE id = ?;`;
		console.log(`Executando query: ${query}`);

		await connection.execute(query, [id]);
	} catch (err) {
		throw { code: 500, message: 'Erro inesperado ao deletar pedido' };
	}
}

async function insertOrder(id, clientId, productId, amount) {
	try {
		const connection = await connect();

		// const query = `INSERT INTO orders(id, client_id, product_id, amount) VALUES ("${id}", "${clientId}", "${productId}", ${amount});`;
		const query = `INSERT INTO orders(id, client_id, product_id, amount) VALUES (?, ?, ?, ?);`;
		console.log(`Executando query: ${query}`);

		await connection.execute(query, [id, clientId, productId, amount]);
	} catch (err) {
		if (err.errno === 1062) {
			throw { code: 400, message: 'Já existe um pedido cadastrado com este id!' };
		} else if (err.errno === 1452) {
			throw { code: 400, message: 'Produto não encontrado!' };
		} else {
			throw { code: 500, message: 'Erro inesperado ao tentar cadastrar pedido' };
		}
	}
}

module.exports = { getOrderById, getOrderByClientId, getAllOrders, insertOrder, updateOrderById, deleteOrderById }

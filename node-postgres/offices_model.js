//allows access to .env file for environment variable declaration
require('dotenv').config();
const auth_model = require('./auth_model');
const Pool = require('pg').Pool
const pool = new Pool({
	user: process.env.API_BASE_SUPERUSER_ACCOUNT,
	host: process.env.API_BASE_HOST_URL,
	database: process.env.API_BASE_DATABASE_NAME,
	password: process.env.API_BASE_SUPERUSER_PASSWORD,
	port: process.env.API_BASE_PORT_NUMBER,
});

//used by admin offices page
const getOffices = () => {
	return new Promise((resolve, reject) => { 
		pool.query("SELECT * FROM offices ORDER BY officename;", (error, results) => {
			if (error) reject(error)
			resolve(results);
		});
	});
};

//used by admin offices page
const addOffice = (data) => {
	return new Promise(async(resolve, reject) => {
		const isAuthReqest = await auth_model._verifyAdmin(data.token);
		const isAuthResponse = await isAuthReqest;
		if (isAuthResponse.code !== 200) resolve(isAuthResponse);
		if (isAuthResponse.code === 200) {
			/*
			uses regex to test if the string contains a space, tab, or carriage return
			error codes: 
				201 = office name was created
				409 = provided office name already exists
				600 = office name null.
				601 = office name contains a space.
			*/
			if (data.officeName === "" || data.officeName === null || data.officeName === undefined) resolve({code:600});
			if ((/\s/).test(data.officeName)) resolve({code:601})
			
			pool.query(`
				INSERT INTO offices (officename) 
				VALUES ($1)
				ON CONFLICT("officename")
					DO NOTHING
				RETURNING (SELECT true) AS not_exist;`,
				[data.officeName],
				(error, results) => {
					if (error) {reject(error)}
					if (results.rowCount === 0) resolve({code:409});
					if (results.rowCount === 1) resolve({code:201});
			});	
		}
	}); 
};

//used by admin offices page
const deleteOffice = (data) => {
	return new Promise(async(resolve, reject) => {
		try {
			const isAuthReqest = await auth_model._verifyAdmin(data.token);
			const isAuthResponse = await isAuthReqest;
			if (isAuthResponse.code !== 200) resolve(isAuthResponse);
			if (isAuthResponse.code === 200) {
				pool.query(
					`DELETE FROM offices WHERE officeid=$1`,
					[data.officeId],
					(error, results) => {
						if (error) {reject({code:500,message:error.detail});}
						resolve({code:200});
				});
			}; 
		}
		catch (error) {reject({code:500,message:error.detail});}
	});
}

module.exports = {
    getOffices,
    addOffice,
    deleteOffice
}
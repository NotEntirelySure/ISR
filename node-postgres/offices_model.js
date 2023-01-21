//allows access to .env file for environment variable declaration
require('dotenv').config();

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
const addOffice = (officeName) => {
	
	return new Promise(function(resolve, reject) {
		/*
		uses regex to test if the string contains a space, tab, or carriage return
		error codes: 
			201 = office name was created
			409 = provided office name already exists
			600 = office name null.
			601 = office name contains a space.
		*/
		if (officeName === "" || officeName === null || officeName === undefined) resolve({code:600})
		if ((/\s/).test(officeName)) resolve({code:601})
		
		pool.query(`
			INSERT INTO offices (officename) 
			VALUES ($1)
			ON CONFLICT("officename")
				DO NOTHING
			RETURNING (select true) AS not_exist;`, 
			[officeName],
			(error, results) => {
				if (error) {reject(error)}
				if (results.rowCount === 0) resolve({code:409});
				if (results.rowCount === 1) resolve({code:201});
		});
			
	}); 
};
  
//used by admin offices page
const deleteOffice = (officeID) => {
    return new Promise(function(resolve, reject) { 
        pool.query(`DELETE FROM offices WHERE officeid='${officeID}'`, (error, results) => {
            if (error) {reject(error);}
            resolve(results);
        })
    }) 
}

module.exports = {
    getOffices,
    addOffice,
    deleteOffice
}
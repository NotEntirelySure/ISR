//allows access to .env file for environment variable declaration
require('dotenv').config();
const auth_model = require('./auth_model');
const Pool = require('pg').Pool;
const pool = new Pool({
	user: process.env.API_BASE_SUPERUSER_ACCOUNT,
	host: process.env.API_BASE_HOST_URL,
	database: process.env.API_BASE_DATABASE_NAME,
	password: process.env.API_BASE_SUPERUSER_PASSWORD,
	port: process.env.API_BASE_PORT_NUMBER,
});

//used by manage projects, and vote dashboard page
const getProjects = (token) => {
	return new Promise(async(resolve, reject) => {
		const isAuthReqest = await auth_model._verifyAdmin(token);
		const isAuthResponse = await isAuthReqest;
		if (isAuthResponse.code !== 200) resolve(isAuthResponse);
		if (isAuthResponse.code === 200) {
			pool.query(`
				SELECT
					projects.projectsequence,
					projects.projectid,
					projects.projectdescription,
					pd.projectdomainid,
					pd.projectdomainname,
					pd.projectdomaincolorhex
				FROM projects
				LEFT JOIN projectdomains AS pd
				ON pd.projectdomainid=projects.projectdomain
				ORDER BY projects.projectsequence;`, 
				(error, results) => {
					if (error) {reject(error)}
					resolve(results);
				}
			);
		};
	}); 
};

//used by manage projects page
const getSequenceNumber = () => {
	return new Promise((resolve, reject) => { 
		pool.query("SELECT MAX(projectsequence) AS max_sequence FROM projects;", (error, results) => {
			if (error) {reject(error)}
			resolve(results.rows);
		});
	}); 
};

const getDomains = () => {
	return new Promise(function(resolve, reject) { 
		pool.query("SELECT * FROM projectdomains ORDER BY projectdomainname;", (error, results) => {
			if (error) {reject(error)}
			resolve(results.rows);
		});
	}); 
};

//used by manage projects page
const addProject = (projectID, projectDescription, projectSequence, projectDomain) => {
	let query = `
		INSERT INTO projects (
			projectid,
			projectdescription,
			projectsequence,
			projectdomain
		)
		VALUES (
				'${projectID}',
				$$${projectDescription}$$,
				'${projectSequence}',
				'${projectDomain}'
		);`;
	//accounts for situations where the domain is not specified.
	if (projectDomain === undefined || projectDomain === '' || isNaN(projectDomain)) {
		query = `
			INSERT INTO projects (
				projectid,
				projectdescription,
				projectsequence
			) 
			VALUES (
				'${projectID}',
				$$${projectDescription}$$,
				'${projectSequence}'
			);`
	}
	return new Promise(function(resolve, reject) {
		pool.query(query, (error, results) => {
			if (error) {reject(error)}
			resolve(results);
		});
	});
};

const addDomain = (name, color) => {
	return new Promise((resolve, reject) => {
		pool.query(`
			INSERT INTO projectdomains (
				projectdomainname,
				projectdomaincolorhex
			)
			VALUES (
				$$${name}$$,
				'${color}'
			)`, 
			(error, results) => {
				if (error) {reject(error)}
				resolve(results);
			}
		);
	});
};

//used by manage projects page
const editProject = (data) => {
	return new Promise(function(resolve, reject) { 
			pool.query(`
				UPDATE projects
				SET 
					projectid=$1,
					projectdescription=$2,
					projectsequence=$3,
					projectdomain=$4
				WHERE projectid=$5;`,
				[
					data.previousProjectID,
					data.newProjectDescription, 
					data.newProjectSequence, 
					data.newProjectDomain,
					data.newProjectID
				],
				(error, results) => {
					if (error) {reject(error)}
					resolve(results);
			});
	});
};

const editDomain = (id, name, color) => {
	return new Promise ((resolve, reject) => {
		pool.query(`
			UPDATE projectdomains
			SET projectdomainname=$1, projectdomaincolorhex=$2
			WHERE projectdomainid=$3;`,
			[name, color, id],
			(error, results) => {
				if (error) {reject(error)}
				resolve(results);
		})
	});
};
//used by manage projects page
const deleteProject = (projectID) => {
	let SqlQuery;
	if (projectID === "all") {SqlQuery = 'DELETE FROM projects;';}
	else {SqlQuery = `DELETE FROM projects WHERE projectid='${projectID}';`;}
	return new Promise((resolve, reject) => { 
		pool.query(SqlQuery, (error, results) => {
			if (error) {reject(error);}
			resolve(results);
		});
	});
};

const deleteDomain = (id) => {
	return new Promise((resolve, reject) => { 
		pool.query(
			`DELETE FROM projectdomains WHERE projectdomainid=$1;`,
			[id],
			(error, results) => {
			if (error) {reject(error);}
			resolve(results);
		});
	});
};

const resetProjectsTable = (token) => {
	return new Promise(async(resolve, reject) => {
		const isAuthReqest = await auth_model._verifyAdmin(token);
		const isAuthResponse = await isAuthReqest;
		if (isAuthResponse.code !== 200) resolve(isAuthResponse);
		if (isAuthResponse.code === 200) {
			pool.query(`DELETE FROM projects;`,	(error, results) => {
				if (error) {resolve({"result":500})}
				if (results) {resolve({"result":200})}
			});
		};
	});
};

module.exports = {
	getProjects,
	getSequenceNumber,
	getDomains,
	addProject,
	addDomain,
	editProject,
	editDomain,
	deleteProject,
	deleteDomain,
	resetProjectsTable
}
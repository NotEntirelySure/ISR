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
					resolve({code:200,data:results});
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

const getDomains = (token) => {
	return new Promise (async(resolve, reject) => {
		const isAuthReqest = await auth_model._verifyAdmin(token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) {
			pool.query("SELECT * FROM projectdomains ORDER BY projectdomainname;", (error, results) => {
				if (error) {resolve({code:500, message:error})}
				resolve({code:200,data:results.rows});
			});
		};
	}); 
};

//used by manage projects page
const addIdea = (data) => {
	return new Promise(async(resolve, reject) => {
		const isAuthReqest = await auth_model._verifyAdmin(data.token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) {
			let query = 'INSERT INTO projects (projectid,	projectdescription,	projectsequence, projectdomain)	VALUES ($1,$2,$3,$4);';
			//accounts for situations where the domain is not specified.
			if (data.ideaDomainId === undefined || data.ideaDomainId === '' || isNaN(data.ideaDomainId)) {
				query = 'INSERT INTO projects (projectid, projectdescription,	projectsequence) VALUES ($1,$2,$3);'
			}
			pool.query(
				query,
				[data.ideaId, data.ideaDescription, data.ideaSequence, data.ideaDomainId],
				(error, results) => {
				if (error) resolve({code:500, message:error});
				resolve({code:200});
			});
		};
	});
};

const addDomain = (data) => {
	return new Promise (async(resolve, reject) => {
		const isAuthReqest = await auth_model._verifyAdmin(data.token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) {
			pool.query(`
				INSERT INTO projectdomains (
					projectdomainname,
					projectdomaincolorhex
				)
				VALUES ($1,$2)`, 
				[data.domainName,data.colorHex],
				(error, results) => {
					if (error) resolve({code:500,message:error.detail})
					resolve({code:200, data:results});
				}
			);
		};
	});
};

//used by manage projects page
const editIdea = (data) => {
	return new Promise(async(resolve, reject) => {
		const isAuthReqest = await auth_model._verifyAdmin(data.token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) { 
			pool.query(`
				UPDATE projects
				SET 
					projectid=$1,
					projectdescription=$2,
					projectsequence=$3,
					projectdomain=$4
				WHERE projectid=$5;`,
				[
					data.newProjectId,
					data.newProjectDescription, 
					data.newProjectSequence, 
					data.newProjectDomain,
					data.previousProjectId
				],
				(error, results) => {
					if (error) resolve({code:500, message:error.detail});
					resolve({code:200});
			});
		};
	});
};

const editDomain = (data) => {
	return new Promise (async(resolve, reject) => {
		const isAuthReqest = await auth_model._verifyAdmin(data.token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) {
			pool.query(`
				UPDATE projectdomains
				SET projectdomainname=$1, projectdomaincolorhex=$2
				WHERE projectdomainid=$3;`,
				[data.domainName, data.colorHex, data.domainId],
				(error, results) => {
					if (error) resolve({code:500, message:error});
					resolve({code:200, data:results});
			});
		};
	});
};
//used by manage projects page
const deleteIdea = (data) => {
	return new Promise(async(resolve, reject) => { 
		const isAuthReqest = await auth_model._verifyAdmin(data.token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) {
			if (data.ideaId === "all") {
				pool.query('DELETE FROM projects;', (error, results) => {
					if (error) resolve({code:500, message:error.detail});
					resolve({code:200});
				});
			}
			else {	
				pool.query(
					'DELETE FROM projects WHERE projectid=$1;', 
					[data.ideaId],
					(error, results) => {
						if (error) resolve({code:500, message:error.detail});
						resolve({code:200});
					}
				);
			};
		};
	});
};

const deleteDomain = (data) => {
	return new Promise (async(resolve, reject) => {
		const isAuthReqest = await auth_model._verifyAdmin(data.token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) { 
			pool.query(
				`DELETE FROM projectdomains WHERE projectdomainid=$1;`,
				[data.domainId],
				(error, results) => {
				if (error) resolve({code:500, message:error});
				resolve({code:200, data:results});
			});
		};
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
	addIdea,
	addDomain,
	editIdea,
	editDomain,
	deleteIdea,
	deleteDomain,
	resetProjectsTable
}
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

//used by idea admin, and vote dashboard page
function getIdeas(token) {
	return new Promise(async(resolve, reject) => {
		const isAuthReqest = await auth_model._verifyAdmin(token);
		const isAuthResponse = await isAuthReqest;
		if (isAuthResponse.code !== 200) resolve(isAuthResponse);
		if (isAuthResponse.code === 200) {
			pool.query(`
				SELECT
					i.ideasequence,
					i.ideaid,
					i.ideadescription,
					id.ideadomainid,
					id.ideadomainname,
					id.ideadomaincolorhex
				FROM ideas AS i
				LEFT JOIN ideadomains AS id
				ON id.ideadomainid=i.ideadomain
				ORDER BY i.ideasequence;`, 
				(error, results) => {
					if (error) {reject(error)}
					resolve({code:200,data:results});
				}
			);
		};
	}); 
};

//used by idea administraton page
function getSequenceNumber() {
	return new Promise((resolve, reject) => { 
		pool.query("SELECT MAX(ideasequence) AS max_sequence FROM ideas;", (error, results) => {
			if (error) {reject(error)}
			resolve(results.rows);
		});
	}); 
};

function getDomains(token) {
	return new Promise (async(resolve, reject) => {
		const isAuthReqest = await auth_model._verifyAdmin(token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) {
			pool.query("SELECT * FROM ideadomains ORDER BY ideadomainname;", (error, results) => {
				if (error) resolve({code:500, message:error});
				resolve({code:200,data:results.rows});
			});
		};
	}); 
};

//used by ideas admin page
function addIdea(data) {
	return new Promise(async(resolve, reject) => {
		const isAuthReqest = await auth_model._verifyAdmin(data.token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) {
			let query = 'INSERT INTO ideas (ideaid,	ideadescription, ideasequence, ideadomain) VALUES ($1,$2,$3,$4);';
			pool.query(
				query,
				[data.ideaId, data.ideaDescription, data.ideaSequence, data.ideaDomainId],
				(error, results) => {
				if (error) resolve({code:500, message:error.detail});
				resolve({code:200});
			});
		};
	});
};

function addDomain(data) {
	return new Promise (async(resolve, reject) => {
		const isAuthReqest = await auth_model._verifyAdmin(data.token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) {
			pool.query(`
				INSERT INTO ideadomains (
					ideadomainname,
					ideadomaincolorhex
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

//used by idea admin page
function editIdea(data) {
	return new Promise(async(resolve, reject) => {
		const isAuthReqest = await auth_model._verifyAdmin(data.token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) { 
			pool.query(`
				UPDATE ideas
				SET 
					ideaid=$1,
					ideadescription=$2,
					ideasequence=$3,
					ideadomain=$4
				WHERE ideaid=$5;`,
				[
					data.newIdeaId,
					data.newIdeaDescription, 
					data.newIdeaSequence, 
					data.newIdeaDomain,
					data.previousIdeaId
				],
				(error, results) => {
					if (error) resolve({code:500, message:error.detail});
					resolve({code:200});
			});
		};
	});
};

function editDomain(data) {
	return new Promise (async(resolve, reject) => {
		const isAuthReqest = await auth_model._verifyAdmin(data.token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) {
			pool.query(`
				UPDATE ideadomains
				SET ideadomainname=$1, ideadomaincolorhex=$2
				WHERE ideadomainid=$3;`,
				[data.domainName, data.colorHex, data.domainId],
				(error, results) => {
					if (error) resolve({code:500, message:error});
					resolve({code:200, data:results});
			});
		};
	});
};
//used by manage ideas page
function deleteIdea(data) {
	return new Promise(async(resolve, reject) => { 
		const isAuthReqest = await auth_model._verifyAdmin(data.token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) {
			if (data.ideaId === "all") {
				pool.query('DELETE FROM ideas;', (error, results) => {
					if (error) resolve({code:500, message:error.detail});
					resolve({code:200});
				});
			}
			else {	
				pool.query(
					'DELETE FROM ideas WHERE ideaid=$1;', 
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

function deleteDomain(data) {
	return new Promise (async(resolve, reject) => {
		const isAuthReqest = await auth_model._verifyAdmin(data.token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) { 
			pool.query(
				`DELETE FROM ideadomains WHERE ideadomainid=$1;`,
				[data.domainId],
				(error, results) => {
				if (error) resolve({code:500, message:error});
				resolve({code:200, data:results});
			});
		};
	});
};

function resetIdeasTable(token) {
	return new Promise(async(resolve, reject) => {
		const isAuthReqest = await auth_model._verifyAdmin(token);
		const isAuthResponse = await isAuthReqest;
		if (isAuthResponse.code !== 200) resolve(isAuthResponse);
		if (isAuthResponse.code === 200) {
			pool.query(`DELETE FROM ideas;`,	(error, results) => {
				if (error) {resolve({"result":500})}
				if (results) {resolve({"result":200})}
			});
		};
	});
};

module.exports = {
	getIdeas,
	getSequenceNumber,
	getDomains,
	addIdea,
	addDomain,
	editIdea,
	editDomain,
	deleteIdea,
	deleteDomain,
	resetIdeasTable
}
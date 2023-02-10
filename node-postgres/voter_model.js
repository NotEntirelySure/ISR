//allows access to .env file for environment variable declaration
require('dotenv').config();
const jwt = require('jsonwebtoken');
const auth_model = require('./auth_model');
const Pool = require('pg').Pool;
const pool = new Pool({
  user: process.env.API_BASE_SUPERUSER_ACCOUNT,
  host: process.env.API_BASE_HOST_URL,
  database: process.env.API_BASE_DATABASE_NAME,
  password: process.env.API_BASE_SUPERUSER_PASSWORD,
  port: process.env.API_BASE_PORT_NUMBER,
});

//used by user registration page
const registerVoter = (userInfo) => {
  return new Promise((resolve, reject) => { 
    pool.query(
      'SELECT register_participant($1,$2,$3,$4);',
      [userInfo.title, userInfo.fname, userInfo.lname, userInfo.office],
      (error, results) => {
        if (error) reject({code:500});
        const jwt = auth_model._mintJwt(results.rows[0].register_participant);
        resolve({code:200,token:jwt});
      }
    );
  });
};

const getAllVoters = (token) => {
  return new Promise(async(resolve, reject) => {
    const isAuthReqest = await auth_model._verifyAdmin(token);
		const isAuthResponse = await isAuthReqest;
		if (isAuthResponse.code !== 200) resolve(isAuthResponse);
		if (isAuthResponse.code === 200) { 
      pool.query(`
        SELECT 
          p.participantid,
          p.participanttitle,
          p.participantfname,
          p.participantlname,
          p.participantoffice,
          p.participantloggedin,
          o.officename
        FROM participants as p
        JOIN offices as o on o.officeid=p.participantoffice;`, 
        (error, results) => {
          if (error) {reject(error)}
          resolve(results);
        }
      );
    };
  });
};
//used by user vote page and admin users page
const getVoterInfo = (token) => {  
  return new Promise((resolve, reject) => {
    const isVerified = jwt.verify(token, process.env.JWT_SECRET_KEY)
    console.log(isVerified);
    if (isVerified.participantid){
      pool.query(`
        SELECT 
          p.participantid,
          p.participanttitle,
          p.participantfname,
          p.participantlname,
          p.participantoffice,
          p.participantloggedin,
          o.officename
        FROM participants as p
        JOIN offices AS o ON o.officeid=p.participantoffice
        WHERE participantid=$1;`,
        [isVerified.participantid],
        (error, results) => {
          if (error) {reject(error)}
          resolve(results);
      })
    }
  });
}
    
//used by user admin page
const deleteVoter = (voterID) => {
  return new Promise(function(resolve, reject) { 
    pool.query(`DELETE FROM participants WHERE participantid='${voterID}'`, (error, results) => {
      if (error) {reject(error)}
      resolve(results);
    })
  })
}

const userLogout = (voterId) => {
  return new Promise((resolve, reject) => {
    pool.query(`UPDATE participants SET participantloggedin='false' WHERE participantid='${voterId}'`, (error, results) => {
      if (error) reject(error)
      resolve(results);
    })
  })
}

const resetParticipantsTable = (token) => {
  return new Promise(async(resolve, reject) => {
    const isAuthReqest = await auth_model._verifyAdmin(token);
		const isAuthResponse = await isAuthReqest;
		if (isAuthResponse.code !== 200) resolve(isAuthResponse);
		if (isAuthResponse.code === 200) {
      pool.query(`
        DELETE FROM participants;
        ALTER SEQUENCE participants_participantid_seq RESTART WITH 1;`,
        (error, results) => {
          if (error) {resolve({"result":500})}
          if (results) {resolve({"result":200})}
        }
      );
    };
  });
};

module.exports = {
  registerVoter,
  getVoterInfo,
  getAllVoters,
  deleteVoter,
  userLogout,
  resetParticipantsTable
}
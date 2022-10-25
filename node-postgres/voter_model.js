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

//used by user registration page
const registerVoter = (userInfo) => {
  
  return new Promise(function(resolve, reject) { 
    pool.query(
      `DO $$ 
        BEGIN 
          PERFORM * FROM participants 
          WHERE participanttitle='${userInfo.title}' 
          AND participantfname='${userInfo.fname}' 
          AND participantlname='${userInfo.lname}'
          AND participantoffice='${userInfo.office}';
    
          IF NOT FOUND THEN 
            INSERT INTO participants (
              participanttitle,
              participantfname,
              participantlname,
              participantoffice,
              participantloggedin
            )
            VALUES (
              '${userInfo.title}',
              '${userInfo.fname}',
              '${userInfo.lname}',
              '${userInfo.office}',
              'false'
            );
          END IF;
        END
      $$;
      SELECT participantid FROM participants 
      WHERE participanttitle='${userInfo.title}' 
      AND participantfname='${userInfo.fname}' 
      AND participantlname='${userInfo.lname}'
      AND participantoffice='${userInfo.office}';`, (error, results) => {
        if (error) {reject(error)}
        resolve(results[1].rows[0]);
    });
  });
};

const checkOfficeLoggedIn = (officeId) => {
  return new Promise((resolve, reject) => { 
    pool.query(`SELECT participantid FROM participants WHERE participantoffice='${officeId}' AND participantloggedin='true';`, (error, results) => {
      if (error) {reject(error)}
      resolve(results);
    })
  });
}

const getVoterByName = (userInfo) => {
  return new Promise((resolve, reject) => { 
    pool.query(`
      SELECT participantid
      FROM participants
      WHERE participanttitle='${userInfo.title}' 
      AND participantfname='${userInfo.fname}'
      AND participantlname='${userInfo.lname}'
      AND participantoffice='${userInfo.office}';`, (error, results) => {
      if (error) {reject(error)}
      resolve(results);
    })
  });
}
//used by user vote page and admin vote page
const getVoterInfo = (voterID) => {
  let SqlQuery;
  if (voterID === "all"){SqlQuery = "SELECT * FROM participants ORDER BY participantid";}
  else {SqlQuery = `SELECT * FROM participants WHERE participantid='${voterID}'`}
  return new Promise((resolve, reject) => { 
    pool.query(SqlQuery, (error, results) => {
      if (error) {reject(error)}
      resolve(results);
    })
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

const resetParticipantsTable = () => {
  return new Promise(function(resolve, reject) {
    pool.query(`
      DROP TABLE participants;
      CREATE TABLE participants (
        participantid SERIAL,
        participanttitle VARCHAR(6),
        participantfname VARCHAR(25),
        participantlname VARCHAR(25),
        participantoffice VARCHAR(255)
      );`, (error, results) => {
        if (error) {resolve({"result":500})}
        if (results) {resolve({"result":200})}
    })
  })
} 

module.exports = {
  registerVoter,
  checkOfficeLoggedIn,
  getVoterByName,
  getVoterInfo,
  deleteVoter,
  userLogout,
  resetParticipantsTable
}
//allows access to .env file for environment variable declaration
require('dotenv').config();

const Pool = require('pg').Pool
const pool = new Pool({
  user: process.env.API_BASE_PARTICIPANT_ACCOUNT,
  host: process.env.API_BASE_HOST_URL,
  database: process.env.API_BASE_DATABASE_NAME,
  password: process.env.API_BASE_DATABASE_PARTICIPANT_PASSWORD,
  port: process.env.API_BASE_PORT_NUMBER,
});

const getOffices = () => {
  return new Promise(function(resolve, reject) { 
      pool.query("SELECT * FROM offices ORDER BY officename;", (error, results) => {
          if (error) {reject(error)}
          resolve(results);
      });
  }); 
};

const registerParticipant = (userInfo) => {
  
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

const userLogout = (voterId) => {
  return new Promise((resolve, reject) => {
    pool.query(`UPDATE participants SET participantloggedin='false' WHERE participantid='${voterId}'`, (error, results) => {
      if (error) reject(error)
      resolve(results);
    })
  })
}

const submitVote = (values) => {
    return new Promise(function(resolve, reject) {
      pool.query(`DO $$ 
        BEGIN 
          PERFORM * FROM votes WHERE voteprojectid='${values.projectID}' AND voteparticipantid='${values.voterID}';          
          IF FOUND THEN UPDATE votes SET votevalue='${values.voteValue}' WHERE voteprojectid='${values.projectID}' AND voteparticipantid='${values.voterID}';
          ELSE INSERT INTO votes (voteprojectid, voteparticipantid, voteparticipantoffice, votevalue) VALUES ('${values.projectID}', '${values.voterID}', '${values.office}', '${values.voteValue}');
          END IF;
        END
      $$;`, (error, results) => {
        if (error) {reject(error)}
        if (values.source === "admin") {
          if (values.comment === "") {values["comment"] = "Vote added by administrator."}
            pool.query(`
              INSERT INTO changelog (
                changevoteid,
                changenewvalue,
                changetime,
                changeaction,
                changecomment
              )
              VALUES (
                (SELECT voteid FROM votes WHERE voteprojectid='${values.projectID}' AND voteparticipantid='${values.voterID}'),
                '${values.voteValue}',
                (SELECT NOW()),
                'add',
                $$${values.comment}$$
              );`, (error, results) => {
                if (error) {reject(error)}
                resolve(results);
            })
          }
          resolve(results);
        })
      }) 
    }

module.exports = {submitVote};
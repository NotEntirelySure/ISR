//allows access to .env file for environment variable declaration
require('dotenv').config();
const jwt = require('jsonwebtoken');
const auth_model = require('./auth_model');
const Pool = require('pg').Pool
const pool = new Pool({
  user: process.env.API_BASE_PARTICIPANT_ACCOUNT,
  host: process.env.API_BASE_HOST_URL,
  database: process.env.API_BASE_DATABASE_NAME,
  password: process.env.API_BASE_DATABASE_PARTICIPANT_PASSWORD,
  port: process.env.API_BASE_PORT_NUMBER,
});

//used by user registration page
const registerParticipant = (userInfo) => {
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

const getParticipantInfo = (token) => {  
  return new Promise((resolve, reject) => {
    try{
      const isVerified = jwt.verify(token, process.env.JWT_SECRET_KEY)
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
  }
  catch (error) {console.log(error);}
  });
}

const getVoteHistory = (token) => {
  return new Promise(async(resolve, reject) => {
		const isAuthReqest = await auth_model._verifyParticipant(token);
		const isAuthResponse = await isAuthReqest;
		if (isAuthResponse.code !== 200) resolve(isAuthResponse);
		if (isAuthResponse.code === 200) {
			pool.query(`
        SELECT voteprojectid, votevalue, votetime
        FROM votes
        WHERE voteparticipantid=$1
        ORDER BY votetime;`,
				[isAuthResponse.participantId],
				(error, results) => {
					if (error) reject(error);
          resolve({code:200,historyData:results.rows});
			});
		}
	}); 
}

//used by user vote page
const castVote = (data) => {
  return new Promise(function(resolve, reject) {
    if (values.source === "admin" && values.comment === "") values["comment"] = "Admin created or modified this vote."
    pool.query(
      'SELECT submit_vote($1,$2,$3,$4,$5);',
      [
        data.values.projectID,
        data.values.voterID,
        data.values.voteValue,
        data.values.source,
        data.values.comment
      ],
      (error, results) => {
        if (error) reject({code:500});
        if (results.rows[0].submit_vote === 0) reject({code:500, message:"An error occured submitting the vote."});
        if (results.rows[0].submit_vote === 1) resolve({code:200});
        reject({code:404});
      }
    );
  });
};


module.exports = {
  registerParticipant,
  getParticipantInfo,
  getVoteHistory,
  castVote
};
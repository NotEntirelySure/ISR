/*
  The dotenv library allows access to .env file for environment variable declaration.
  For server functionality, the path must be specified.
  Uncomment the import with the specified path. This must be done in all imported model files as well.
*/
//require('dotenv').config({path:'C:/inetpub/isr/api/.env'});
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
function registerParticipant(userInfo) {
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

function logoutParticipant(data) {
  return new Promise (async(resolve, reject) => {
    const isAuthReqest = await auth_model._verifyParticipant(data.token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) {
      if (isAuthResponse.participantId !== data.participantId) resolve({code:401,message:"Requested participant logout does not match provided token."})
      if (isAuthResponse.participantId === data.participantId) {
        pool.query(
          `UPDATE participants SET participantloggedin='false' WHERE participantid=$1;`,
          [data.participantId],
          (error, results) => {
            if (error) resolve({code:500, message:error});
            resolve({code:200});
          }
        );
      };
    };
  });
};

function getParticipantInfo(token) {  
  return new Promise((resolve, reject) => {
    try {
      const isVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
      if (isVerified.participantid) {
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
            if (error) reject(error);
            resolve(results);
        })
      }
    }
    catch (error) {
      resolve({
        code:500,
        message:error
      });
    };
  });
};

function getVoteHistory(token) {
  return new Promise(async(resolve, reject) => {
		const isAuthReqest = await auth_model._verifyParticipant(token);
		const isAuthResponse = await isAuthReqest;
		if (isAuthResponse.code !== 200) resolve(isAuthResponse);
		if (isAuthResponse.code === 200) {
			pool.query(`
        SELECT voteideaid, votevalue, votetime
        FROM votes
        WHERE voteparticipantid=$1
        ORDER BY votetime;`,
				[isAuthResponse.participantId],
				(error, results) => {
					if (error) reject({code:500, message:error.detail});
          resolve({code:200,historyData:results.rows});
			});
		}
	}); 
}

function castVote(data) {
  return new Promise(async(resolve, reject) => {
    try {
      const isAuthReqest = await auth_model._verifyJwt(data.token);
      const isAuthResponse = await isAuthReqest;
      if (isAuthResponse.code !== 200) resolve(isAuthResponse);
      if (isAuthResponse.code === 200) {
        pool.query(
        'SELECT submit_vote($1,$2,$3,$4,$5);',
        [
          data.values.ideaId,
          data.values.participantId,
          data.values.voteValue,
          data.values.source,
          data.values.comment
        ],
        (error, results) => {
          if (error) resolve({code:500, message:error.message});
          if (results.rows[0].submit_vote === 0) resolve({code:500, message:"An error occured submitting the vote."});
          if (results.rows[0].submit_vote === 1) resolve({code:200});
          resolve({code:404});
        }
        );
      };
    }
    catch (catchError) {resolve({code:500, message:catchError.message})}
  });
};


module.exports = {
  logoutParticipant,
  registerParticipant,
  getParticipantInfo,
  getVoteHistory,
  castVote
};
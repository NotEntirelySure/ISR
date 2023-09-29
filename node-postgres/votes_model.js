/*
  The dotenv library allows access to .env file for environment variable declaration.
  For server functionality, the path must be specified.
  Uncomment the import with the specified path. This must be done in all imported model files as well.
*/
//require('dotenv').config({path:'C:/inetpub/isr/api/.env'});
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

//used by statistics page
function getAllVotes(token) {
  return new Promise(async(resolve, reject) => {
    const isAuthReqest = await auth_model._verifyAdmin(token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) {
      pool.query(`
        SELECT
          v.voteid,
          v.voteideaid,
          v.votevalue,
          v.votetime,
          v.votemodified,
          p.participantid,
          p.participanttitle,
          p.participantfname,
          p.participantlname,
          o.officename
        FROM votes as v
        LEFT JOIN participants AS p ON p.participantid=v.voteparticipantid
        LEFT JOIN offices AS o ON o.officeid=p.participantoffice
        ORDER BY v.voteid;`,
        (error, results) => {
          if (error) resolve({code:500, message:error.detail});
          resolve({code:200,data:results.rows});
        }
      );
    };
  });
};

//used by statistics page
function getVotesByOffice(data) {
  return new Promise(async(resolve, reject) => {
    const officeName = data.split('&')[0];
    const token = data.split('&')[1];
    const isAuthReqest = await auth_model._verifyAdmin(token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) { 
      pool.query(
        `SELECT
          v.voteideaid,
          v.voteparticipantid,
          v.votevalue,
          o.officename,
          p.participanttitle,
          p.participantfname,
          p.participantlname,
          i.ideadescription
        FROM votes AS v
        LEFT JOIN participants AS p ON p.participantid=v.voteparticipantid
        LEFT JOIN ideas AS i ON v.voteideaid=i.ideaid
        LEFT JOIN offices AS o ON o.officeid=p.participantoffice
        WHERE o.officename=$1;`,
        [officeName],
        (error, results) => {
          if (error) resolve({code:500, message:error.detail})
          resolve({code:200, data:results.rows});
      })
    };
  }); 
};

function getChangeLogById(data) {
  return new Promise(async(resolve, reject) => {
    const isAuthReqest = await auth_model._verifyAdmin(data.split('&')[1]);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) {
      pool.query(
        `SELECT * FROM changelog WHERE changevoteid=$1;`,
        [data.split('&')[0]],
        (error, results) => {
          if (error) resolve({code:500,message:error.detail});
          resolve({code:200, data:results.rows});
        }
      );
    };
  });
};

function getAllChangeLogs(token) {
  return new Promise(async(resolve, reject) => {
    const isAuthReqest = await auth_model._verifyAdmin(token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) {
      pool.query(
        `SELECT
          cl.changeid,
          cl.changevoteid,
          cl.changepreviousvalue,
          cl.changenewvalue,
          cl.changetime,
          cl.changecomment,
          cl.changeaction,
          v.voteideaid,
          v.voteparticipantid,
          v.votevalue,
          i.ideaid,
          i.ideadescription,
          p.participantid,
          p.participanttitle,
          p.participantfname,
          p.participantlname
        FROM changelog AS cl
        LEFT JOIN votes AS v ON cl.changevoteid=v.voteid
        LEFT JOIN ideas AS i ON i.ideaid=v.voteideaid
        LEFT JOIN participants as p ON v.voteparticipantid=p.participantid;`,
        (error, results) => {
          if (error) resolve({code:500, message:error.detail});
          resolve({code:200, data:results});
        }
      );
    };
  });
};

//used by admin vote page
function addVote(data) {
  return new Promise(async(resolve, reject) => {
    const isAuthReqest = await auth_model._verifyAdmin(data.token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) {
      if (data.values.source === "admin" && data.values.comment === "") data.values["comment"] = "Admin created/edited this vote.";
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
          if (error) resolve({code:500,message:error.detail});
          if (results.rows[0].submit_vote === 0) reject({code:500, message:"An error occured submitting the vote."});
          if (results.rows[0].submit_vote === 1) resolve({code:200});
          resolve({code:404,message:"An unknown error occured while attempting to submit vote."});
        }
      );
    };
  });
};

//used by admin vote page
function batchAddVote(data) {
  return new Promise(async(resolve, reject) => {
    const isAuthReqest = await auth_model._verifyAdmin(data.token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) {
      pool.query(
        `SELECT batch_vote ($1,$2,$3,$4,$5,$6);`,
        [
          data.values.ideaId,
          data.values.title,
          data.values.fName,
          data.values.lName,
          data.values.office,
          data.values.vote
        ],
        (error, results) => {
          if (error) resolve({code:500,message:error.detail});
          if (results.rows[0].batch_vote === 0) resolve({code:500, message:`Could not submit vote. Idea ID ${data.values.ideaId} was not found in the database.`});
          if (results.rows[0].batch_vote === 1) resolve({code:200});
          if (results.rows[0].batch_vote === 2) resolve({code:500, message:`The vote was processed by the database function but the function took no action.`});
          resolve({code:404,message:"An unknown error occured while attempting to submit the vote."});
        }
      );
    };
  });
};

//used by admin vote page to check if vote exists before manually adding a vote.
function checkVote(data) {
  return new Promise(async(resolve, reject) => {
    const isAuthReqest = await auth_model._verifyAdmin(data.split('&')[2]);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) {
      pool.query(`
        SELECT (
          EXISTS (
            SELECT FROM votes 
            WHERE voteparticipantid=$1 
            AND voteideaid=$2
          )
        );`,
        [data.split('&')[0], data.split('&')[1]],
        (error, results) => {
        if (error) resolve({code:500,message:error.detail});
        resolve({code:200, data:results.rows});
      });
    };
  });
};
//used by admin vote page
function deleteVote(data) {
  return new Promise(async(resolve, reject) => {
    const isAuthReqest = await auth_model._verifyAdmin(data.token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) {
      pool.query('SELECT delete_vote($1);',[data.voteId], (error, results) => {
        if (error) reject({code:500, message:error.detail});
        switch (results.rows[0].delete_vote) {
          case 1:
            resolve({code:200});
            break;
          case 0:
            resolve({code:500, message: `An error occured while attempting to delete vote ${data.voteId}`});
            break;
          case -1:
            resolve({code:404, message:`An error occured while attempting to delete vote ID ${data.voteId}. A vote with that ID was not found in the database.`});
            break;
          default: resolve({code:500, message: `An unknown error occured while attempting to delete vote ${data.voteId}`});
        };
      });
    };
  });
};

function deleteAllVotes(token) {
  return new Promise(async(resolve, reject) => {
    const isAuthReqest = await auth_model._verifyAdmin(token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) {
      pool.query(
        `DELETE FROM votes;
        INSERT INTO changelog (
          changetime,
          changeaction,
          changecomment
        )
        VALUES (
          (SELECT NOW()),
          'delete',
          'All votes deleted by admin'
        );`,
        (error) => {
          if (error) reject({code:500,message:error});
          resolve({code:200});
      });
    };
  });
};

//used by admin vote page     
function editVote(data) {
  return new Promise(async(resolve, reject) => { 
    const isAuthReqest = await auth_model._verifyAdmin(data.token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) {
      if (data.comment === "") data["comment"] = 'Vote value modified by administrator';
      pool.query(
        `UPDATE votes SET votevalue=$2, votemodified=true WHERE voteid=$1;`,
        [data.voteid, data.newvalue],
        (error) => {
          if (error) resolve({code:500, message:error.detail});
          pool.query(
            `INSERT INTO changelog (
              changevoteid,
              changepreviousvalue,
              changenewvalue,
              changetime,
              changecomment,
              changeaction
            )
            VALUES ($1,$2,$3,(SELECT NOW()),$4,'edit');`,
            [
              data.voteid,
              data.previousvalue,
              data.newvalue,
              data.comment
            ],
            (error) => {
              if (error) resolve({code:500, message:error.detail})
              resolve({code:200})
            }
          );
        }
      );
    };
  }); 
};

function resetVoteTable(token) {
  return new Promise(async(resolve, reject) => {
    const isAuthReqest = await auth_model._verifyAdmin(token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) {
      pool.query(`
        DELETE FROM votes;
        ALTER SEQUENCE votes_voteid_seq RESTART WITH 1;`,
        (error, results) => {
          if (error) {resolve({"result":500,"message":error})}
          if (results) {resolve({"result":200})}
        }
      );
    }
  })
}

function resetLogTable(token) {
  return new Promise(async(resolve, reject) => {
    const isAuthReqest = await auth_model._verifyAdmin(token);
    const isAuthResponse = await isAuthReqest;
    if (isAuthResponse.code !== 200) resolve(isAuthResponse);
    if (isAuthResponse.code === 200) {
      pool.query(`
        DELETE FROM changelog;
        ALTER SEQUENCE changelog_changeid_seq RESTART WITH 1;`, 
        (error, results) => {
          if (error) {resolve({"result":500})}
          if (results) {resolve({"result":200})}
        }
      );
    };
  });
};

module.exports = {
  getAllVotes,
  getVotesByOffice,
  getChangeLogById,
  getAllChangeLogs,
  addVote,
  batchAddVote,
  editVote,
  deleteVote,
  deleteAllVotes,
  checkVote,
  resetVoteTable,
  resetLogTable
};
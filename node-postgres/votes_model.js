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

//used by statistics page
const getAllVotes = () => {
  return new Promise(function(resolve, reject) {
    pool.query(`
      SELECT
        v.voteid,
        v.voteprojectid,
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
        if (error) {reject(error)}
        resolve(results.rows);
      }
    );
  });
};

//used by statistics and admin votes page
const getVotesByProject = (projectID) => {
  return new Promise((resolve, reject) => { 
    pool.query(
      `SELECT voteparticipantid, votevalue
      FROM votes
      WHERE voteprojectid=$1
      ORDER BY voteid;`,
      [projectID],
      (error, results) => {
        if (error) {reject(error)}
        resolve(results.rows);
      }
    );
  });
};

//used by statistics page
const getVotesByOffice = (officeName) => {
  return new Promise(function(resolve, reject) { 
    pool.query(
      `SELECT
        v.voteprojectid,
        v.voteparticipantid,
        v.voteValue,
        o.officename,
        p.participanttitle,
        p.participantfname,
        p.participantlname,
        pr.projectdescription
      FROM votes AS v
      LEFT JOIN participants AS p ON p.participantid=v.voteparticipantid
      LEFT JOIN projects AS pr ON v.voteprojectid=pr.projectid
      LEFT JOIN offices AS o ON o.officeid=p.participantoffice
      WHERE o.officename=$1;`,
      [officeName],
      (error, results) => {
        if (error) {reject(error)}
        resolve(results.rows);
    })
  }) 
}

const getChangeLogById = (voteId) => {
  return new Promise((resolve, reject) => {
    pool.query(
      `SELECT * FROM changelog WHERE changevoteid=$1;`,
      [voteId],
      (error, results) => {
        if (error) reject(error)
        resolve(results.rows)
      }
    );
  })
}

const getAllChangeLogs = () => {
  return new Promise((resolve, reject) => {
    pool.query(
      `SELECT
        cl.changeid,
        cl.changevoteid,
        cl.changepreviousvalue,
        cl.changenewvalue,
        cl.changetime,
        cl.changecomment,
        cl.changeaction,
        v.voteprojectid,
        v.voteparticipantid,
        v.votevalue,
        p.projectid,
        p.projectdescription,
        pa.participantid,
        pa.participanttitle,
        pa.participantfname,
        pa.participantlname
      FROM changelog AS cl
      LEFT JOIN votes AS v ON cl.changevoteid=v.voteid
      LEFT JOIN projects AS p ON p.projectid=v.voteprojectid
      LEFT JOIN participants as pa ON v.voteparticipantid=pa.participantid;`,
      (error, results) => {
        if (error) reject(error)
        resolve(results)
      }
    );
  });
};

//used by user vote page
const submitVote = (values) => {
  return new Promise(function(resolve, reject) {
    if (values.source === "admin" && values.comment === "") values["comment"] = "Admin created or modified this vote."
    pool.query(
      'SELECT submit_vote($1,$2,$3,$4,$5);',
      [values.projectID,values.voterID,values.voteValue,values.source,values.comment],
      (error, results) => {
        if (error) reject({code:500});
        if (results.rows[0].submit_vote === 0) reject({code:500, message:"An error occured submitting the vote."});
        if (results.rows[0].submit_vote === 1) resolve({code:200});
        reject({code:404});
      }
    );
  });
};

const checkVote = (voteTag) => {
  //QUERY SQL for existence of vote
  return new Promise(function(resolve, reject) { 
    pool.query(`
      SELECT (
        EXISTS (
          SELECT FROM votes 
          WHERE voteparticipantid='${voteTag.split('&')[0]}' 
          AND voteprojectid='${voteTag.split('&')[1]}'
        )
      );`, (error, results) => {
      if (error) {reject(error)}
      resolve(results.rows);
    })
  })
}
//used by admin vote page
const deleteVote = (voteId) => {
  return new Promise((resolve, reject) => {
    pool.query('SELECT delete_vote($1);',[voteId], (error, results) => {
      if (error) reject({code:500, message:error});
      switch (results.rows[0].delete_vote) {
        case 1: 
          resolve({code:200});
          break;
        case -1:
          resolve({code:404});
          break;
        case 0:
          resolve({code:500});
          break;
      };
    });
  });
};

const deleteAllVotes = () => {
  return new Promise((resolve, reject) => {
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
      if (error) reject(error);
      resolve({code:200});
    })
  })
}

//used by admin vote page     
const editVote = (values) => {
  return new Promise(function(resolve, reject) { 
    if (values.comment === "") values["comment"] = 'Vote value modified by administrator';
    pool.query(`
      UPDATE votes SET votevalue='${values.newvalue}' WHERE voteid='${values.voteid}';
      INSERT INTO changelog (
        changevoteid,
        changepreviousvalue,
        changenewvalue,
        changetime,
        changecomment,
        changeaction
      )
      VALUES (
        '${values.voteid}', 
        '${values.previousvalue}',
        '${values.newvalue}',
        (SELECT NOW()),
        $$${values.comment}$$,
        'edit'
      );`,
      (error, results) => {
        if (error) reject(error);
        resolve(results);
      }
    )
  }); 
}

  const resetVoteTable = () => {
    return new Promise(function(resolve, reject) {
      pool.query(`
        DROP TABLE votes;
        CREATE TABLE votes (
          voteid SERIAL,
          voteprojectid VARCHAR,
          voteparticipantid INT,
          votevalue INT
        );`, (error, results) => {
          if (error) {resolve({"result":500})}
          if (results) {resolve({"result":200})}
      })
    })
  }

  const resetLogTable = () => {
    return new Promise(function(resolve, reject) {
      pool.query(`
        DROP TABLE changelog;
        CREATE TABLE changelog (
          changeid SERIAL PRIMARY KEY,
          changevoteid INT,
          changepreviousvalue INT,
          changenewvalue INT,
          changetime TIMESTAMP,
          changeaction VARCHAR,
          changecomment TEXT
        );`, (error, results) => {
          if (error) {resolve({"result":500})}
          if (results) {resolve({"result":200})}
      })
    })
  }
module.exports = {
  getAllVotes,
  getVotesByProject,
  getVotesByOffice,
  getChangeLogById,
  getAllChangeLogs,
  submitVote,
  editVote,
  deleteVote,
  deleteAllVotes,
  checkVote,
  resetVoteTable,
  resetLogTable
};
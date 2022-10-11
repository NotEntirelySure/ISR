const Pool = require('pg').Pool
const pool = new Pool({
  user: 'superuser',
  host: 'localhost',
  database: 'isr',
  password: 'root',
  port: 5432,
});

//used by statistics page
const getAllVotes = () => {
  return new Promise(function(resolve, reject) {
    pool.query(`
      SELECT
        v.voteid,
        v.voteprojectid,
        v.voteparticipantid,
        v.votevalue,
        o.officename
      FROM votes AS v
      LEFT JOIN participants AS p ON p.participantid=v.voteparticipantid
      LEFT JOIN offices AS o ON o.officeid=p.participantoffice
      ORDER BY voteid;`, (error, results) => {
      if (error) {reject(error)}
      resolve(results);
    })
  }) 
}

//used by statistics and admin votes page
const getVotesByProject = (projectID) => {
  let SqlQuery;
  if (projectID === "all"){
    SqlQuery = `
      SELECT 
        v.voteid,
        v.voteprojectid,
        v.voteValue,
        v.voteparticipantid,
        cl.changeid,
        cl.changetime,
        cl.changecomment
      FROM votes AS v
      LEFT JOIN changelog AS cl ON cl.changevoteid=v.voteid
      ORDER BY v.voteid;
    `;
  }
  else {
    SqlQuery = `
      SELECT 
        v.voteparticipantid,
        v.votevalue,
        o.officename
      FROM votes AS v
      LEFT JOIN participants AS p ON p.participantid=v.voteparticipantid
      LEFT JOIN offices AS o ON o.officeid=p.participantoffice
      WHERE voteprojectid='${projectID}';
    `;
  }
  return new Promise(function(resolve, reject) { 
    pool.query(SqlQuery, (error, results) => {
      if (error) {reject(error)}
      resolve(results.rows);
    })
  }) 
}

//used by statistics page
const getVotesByVoter = (voterID) => {
  return new Promise(function(resolve, reject) { 
    pool.query(`SELECT voteprojectid, votevalue FROM votes WHERE voteparticipantid='${voterID}';`, (error, results) => {
      if (error) {reject(error)}
      resolve(results.rows);
    })
  }) 
}

//used by statistics page
const getVotesByOffice = (officeID) => {
  return new Promise(function(resolve, reject) { 
    pool.query(`
      SELECT
        v.voteprojectid,
        v.voteValue,
        pr.projectdescription,
        pa.participanttitle,
        pa.participantfname,
        pa.participantlname,
        o.officename
      FROM votes AS v
      LEFT JOIN projects AS pr ON v.voteprojectid=pr.projectid
      LEFT JOIN participants AS pa ON pa.participantid=v.voteparticipantid
      LEFT JOIN offices AS o ON o.officeid=pa.participantoffice
      WHERE pa.participantoffice=${officeID};
    `, (error, results) => {
      if (error) {reject(error)}
      resolve(results);
    })
  }) 
}

const getChangeLogs = () => {

  return new Promise((resolve, reject) => {
    pool.query(`
      SELECT  
        cl.changeid,
        cl.changevoteid,
        cl.changepreviousvalue,
        cl.changenewvalue,
        cl.changetime,
        cl.changecomment,
        cl.changeaction,
        v.voteprojectid,
        v.voteparticipantid,
        v.voteparticipantoffice,
        v.votevalue,
        p.projectid,
        p.projectdescription,
        part.participantid,
        part.participanttitle,
        part.participantfname,
        part.participantlname
      FROM changelog AS cl
      LEFT JOIN votes AS v
      ON cl.changevoteid=v.voteid
      LEFT JOIN projects AS p
      ON p.projectid=v.voteprojectid
      LEFT JOIN participants as part
      ON v.voteparticipantid=part.participantid;
    `, (error, results) => {
      if (error) reject(error)
      resolve(results)
    })
  })

}

//used by user vote page
const submitVote = (values) => {
  return new Promise(function(resolve, reject) {
    pool.query(`DO $$ 
      BEGIN 
        PERFORM * FROM votes WHERE voteprojectid='${values.projectID}' AND voteparticipantid='${values.voterID}';          
        IF FOUND THEN UPDATE votes SET votevalue='${values.voteValue}' WHERE voteprojectid='${values.projectID}' AND voteparticipantid='${values.voterID}';
        ELSE INSERT INTO votes (voteprojectid, voteparticipantid, votevalue) VALUES ('${values.projectID}', '${values.voterID}', '${values.voteValue}');
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
const deleteVote = (voteID) => {
  let SqlQuery;
  if (voteID === "all"){SqlQuery = "DELETE FROM votes";}
  else {SqlQuery = `DELETE FROM votes WHERE voteid='${voteID}';`}
  return new Promise(function(resolve, reject) {
    pool.query(SqlQuery, (error, results) => {
      if (error) {reject(error)}
      resolve(results);
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
          voteparticipantoffice VARCHAR,
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
  getVotesByVoter,
  getVotesByOffice,
  getChangeLogs,
  submitVote,
  editVote,
  deleteVote,
  checkVote,
  resetVoteTable,
  resetLogTable
};
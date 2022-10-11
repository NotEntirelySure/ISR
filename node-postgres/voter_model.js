const Pool = require('pg').Pool
const pool = new Pool({
  user: 'superuser',
  host: 'localhost',
  database: 'isr',
  password: 'root',
  port: 5432,
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
          AND participantoffice=${userInfo.office};
    
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
              ${userInfo.office},
              'false'
            );
          END IF;
        END
      $$;
      SELECT participantid FROM participants 
      WHERE participanttitle='${userInfo.title}' 
      AND participantfname='${userInfo.fname}' 
      AND participantlname='${userInfo.lname}'
      AND participantoffice=${userInfo.office};`, (error, results) => {
        if (error) {reject(error)}
        resolve(results[1].rows[0]);
    });
  });
};

const checkOfficeLoggedIn = (voterId) => {
  return new Promise((resolve, reject) => { 
    pool.query(`
      SELECT participantid
      FROM participants
      WHERE participantoffice=(SELECT participantoffice FROM participants WHERE participantid=${voterId}) AND participantloggedin='true';
    `, (error, results) => {
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
  if (voterID === "all"){
    SqlQuery = `
      SELECT
        p.participantid,
        p.participanttitle,
        p.participantfname,
        p.participantlname,
        p.participantloggedin,
        o.officename
      FROM participants AS p
      JOIN offices AS o ON p.participantoffice=o.officeid
      ORDER BY participantid;
    `
  }
  else {SqlQuery = `
    SELECT
      p.participantid,
      p.participanttitle,
      p.participantfname,
      p.participantlname,
      p.participantloggedin,
      o.officename
    FROM participants AS p
    JOIN offices AS o ON p.participantoffice=o.officeid
    WHERE participantid='${voterID}';`}
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
      if (error) reject(JSON.stringify({result:error.name,code:error.code}));
      resolve(JSON.stringify({result:"success", code:200}));
    })
  })
}

const userLogout = (voterId) => {
  return new Promise((resolve, reject) => {
    pool.query(`
      UPDATE participants
      SET participantloggedin='false'
      WHERE participantid='${voterId}'
    `, (error, results) => {
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
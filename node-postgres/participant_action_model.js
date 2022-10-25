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
//allows access to .env file for environment variable declaration
require('dotenv').config();

const jwt = require('jsonwebtoken');
const Pool = require('pg').Pool
const pool = new Pool({
  user: process.env.API_BASE_SUPERUSER_ACCOUNT,
  host: process.env.API_BASE_HOST_URL,
  database: process.env.API_BASE_DATABASE_NAME,
  password: process.env.API_BASE_SUPERUSER_PASSWORD,
  port: process.env.API_BASE_PORT_NUMBER,
});

//used by admin login page
const adminLogin = (username, password) => {
  sqlQuery = `
    SELECT (
      EXISTS (
        SELECT FROM administrators
        WHERE username=$1
        AND password=crypt($2, password)
      )
    );`;
  sqlValues = [username,password];

  return new Promise((resolve, reject) => {
    pool.query(sqlQuery, sqlValues, (error, results) => {
      if (error) reject(error);
      if (results.rows[0].exists) {
        const token = jwt.sign({'username':`${username}`,type:'admin'}, process.env.JWT_SECRET_KEY,{expiresIn: '1d'});
        resolve({"jwt":token});
      }
      else resolve({"result":401});
    })
  }) 
}

const userLogin = (userId) => {
  return new Promise((resolve, reject) => {
    pool.query(`SELECT (EXISTS (SELECT FROM participants WHERE participantid='${userId}'));`, (error, results) => {
      if (error) reject(error)
      if (results.rows[0].exists) {
        //set the user's login state to true, and set everyone else from that same office to false.
        pool.query(`
          UPDATE participants 
          SET participantloggedin='true'
          WHERE participantid='${userId}';
          UPDATE participants 
          SET participantloggedin='false' 
          WHERE participantoffice=(
            SELECT participantoffice 
            FROM participants
            WHERE participantid='${userId}'
          )
          AND participantid!='${userId}';
          `, (error, results) => {
          if (error) reject(error)
          const token = jwt.sign({"participantid":userId}, process.env.JWT_SECRET_KEY,{expiresIn: '4d'});
          resolve({"token":token});
        })
      }
      if(!results.rows[0].exists) {resolve({"error":401})}
    })
  }) 
}

const userLogout = (userId) => {
  return new Promise((resolve, reject) => {
    pool.query(`UPDATE participants SET participantloggedin='false' WHERE participantid='${userId}'));`, (error, results) => {
      if (error) reject(error)
      resolve({"result":200});
    })
  })
}

const mintJwt = (userId) => {
  return new Promise ((resolve, reject) => {
    const token = jwt.sign({"participantid":userId}, process.env.JWT_SECRET_KEY,{expiresIn: '4d'});
    resolve({"result":200, "token":token});
  })
}

const verifyJwt = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
      if (err) resolve({"status":401}); 
      if (!err) resolve({"status":200}); 
    })
  })
}

module.exports = {
  adminLogin,
  userLogin,
  userLogout,
  mintJwt,
  verifyJwt
};
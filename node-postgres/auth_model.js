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
  const sqlQuery = `
    SELECT (
      EXISTS (
        SELECT FROM administrators
        WHERE username=$1
        AND password=crypt($2, password)
      )
    );`;

  const sqlValues = [username,password];

  return new Promise((resolve, reject) => {
    pool.query(sqlQuery, sqlValues, (error, results) => {
      if (error) reject(error);
      if (results.rows[0].exists) {
        const token = jwt.sign({'username':`${username}`,type:'admin'}, process.env.JWT_SECRET_KEY,{expiresIn: '1d'});
        resolve({"result":200,"jwt":token});
      }
      else resolve({"result":401});
    })
  }) 
}

const userLogin = (token) => {
  return new Promise((resolve, reject) => {
    try{
      const isVerified = jwt.verify(token, process.env.JWT_SECRET_KEY); 
      pool.query(`SELECT login_participant($1);`, [isVerified.participantid], (error, results) => {
        if (error) resolve({"code":500,"message":"query error"});
        if (results.rows[0].login_participant === "not_found" ) resolve({"code":401,"source":"not_found"});
        if (results.rows[0].login_participant === "other_logged_in") resolve({"code":601});
        resolve({"code":200});
      });  
    }
    catch (error) {
      if (error.message === 'jwt expired') resolve({"code":602});
      resolve({"code":401,"error":error,"source":"catch block"});
    }
  });
};

const userLogout = (userId) => {
  return new Promise((resolve, reject) => {
    pool.query(
      `UPDATE participants SET participantloggedin='false' WHERE participantid=$1));`,
      [userId],
      (error, results) => {
        if (error) reject(error)
        resolve({"result":200});
      }
    );
  });
};

const _mintJwt = (userId) => {
  return jwt.sign({"participantid":userId}, process.env.JWT_SECRET_KEY,{expiresIn: '4d'});
}

const _verifyJwt = (token) => {
  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) return({"status":401});
    return({"status":200, data:decoded}); 
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

function _verifyAdmin(token) {
  return new Promise((resolve, reject) => {
    try {
      const isVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
      if (!isVerified.username) resolve({code:401, message:"Unauthorized"});
      if (isVerified.username) {
        pool.query(
          `SELECT(EXISTS(SELECT FROM administrators WHERE username=$1));`,
          [isVerified.username],
          (error, results) => {
            if (error) reject({code:403,message:"Unauthorized"});
            if (results.rows[0].exists) resolve({code:200});
            resolve({code:403,message:"Unauthorized"});
          }
        );
      };
    }
    catch (error) {
      if (error.message === "jwt must be provided") {
        resolve({code:401, message:"No authentication token was presented to the server."});
      }
      if (error.message.startsWith('Unexpected token') || error.message.startsWith("Unexpected end")) {
        resolve({code:401, message:"The server was prestented with an invalid authentication token."});
      }
      if (error.message === "invalid signature") {
        resolve({code:401, message:"Invalid signature in authentication token."});
      }
      if (error.message === "jwt expired") {
        resolve({code:401, message:"The supplied authentication token has expired."});
      }
      resolve({code:500,type:error.message})
    }
  })
};

module.exports = {
  adminLogin,
  userLogin,
  userLogout,
  verifyJwt,
  _verifyJwt,
  _mintJwt,
  _verifyAdmin
};
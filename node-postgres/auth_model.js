const jwt = require('jsonwebtoken');
const Pool = require('pg').Pool
const pool = new Pool({
  user: 'superuser',
  host: 'localhost',
  database: 'postgres',
  password: 'root',
  port: 5432,
});

const jwtSecret = "theTip0fTheIceb3rg"

//used by admin login page
const adminLogin = (username, password) => {
  return new Promise(function(resolve, reject) {
    pool.query(`SELECT (EXISTS (SELECT FROM administrators WHERE username='${username}' AND password='${password}'));`, (error, results) => {
      if (error) reject(error);
      if (results.rows[0].exists) {
        const token = jwt.sign({'username':`${username}`,type:'admin'}, jwtSecret,{expiresIn: '1d'});
        resolve({"jwt":token});
      }
      else {resolve({"result":401});}
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
          const token = jwt.sign({"participantid":userId}, jwtSecret,{expiresIn: '4d'});
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
    const token = jwt.sign({"participantid":userId}, jwtSecret,{expiresIn: '4d'});
    resolve({"result":200, "token":token});
  })
}

const verifyJwt = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, jwtSecret, (err, decoded) => {
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
const Pool = require('pg').Pool
const pool = new Pool({
    user: 'superuser',
    host: 'localhost',
    database: 'isr',
    password: 'root',
    port: 5432,
});

//used by admin offices page
const getOffices = () => {
    return new Promise((resolve, reject) => { 
        pool.query("SELECT * FROM offices ORDER BY officename;", (error, results) => {
            if (error) {reject(error)}
            resolve(results);
        });
    }); 
};

//used by admin offices page
const addOffice = (officeName) => {
    
    return new Promise((resolve, reject) => {
        /*
        uses regex to test if the string contains a space, tab, or carriage return
        custom error codes: 
            600 = office name null.
            601 = office name contains a space.
        */
        if (officeName === "" || officeName === null || officeName === undefined) {
            resolve(JSON.stringify({addError:600}))
            return;
        }

        if ((/\s/).test(officeName)) {
            resolve(JSON.stringify({addError:601}))
            return;
        }
        
        pool.query(`INSERT INTO offices (officename) VALUES ('${officeName}');`, (error, results) => {
            if (error) {reject(error)}
            if (results.rowCount === 1) {resolve(JSON.stringify({result:"success"}));}
        });
        
    }); 
};
  
//used by admin offices page
const deleteOffice = (officeID) => {
    return new Promise((resolve, reject) => { 
        pool.query(`DELETE FROM offices WHERE officeid='${officeID}'`, (error, results) => {
            if (error) reject(JSON.stringify({result:error.name,code:error.code}));
            resolve(JSON.stringify({result:"success", code:200}));
        })
    }) 
}

module.exports = {
    getOffices,
    addOffice,
    deleteOffice
}
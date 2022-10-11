const Pool = require('pg').Pool
const pool = new Pool({
    user: 'superuser',
    host: 'localhost',
    database: 'isr',
    password: 'root',
    port: 5432,
});

//used by manage projects, and vote dashboard page
const getProjects = () => {
    return new Promise(function(resolve, reject) {
        pool.query(`
            SELECT
                projects.projectsequence,
                projects.projectid,
                projects.projectdescription,
                pd.projectdomainid,
                pd.projectdomainname,
                pd.projectdomaincolorhex
            FROM projects
            LEFT JOIN projectdomains AS pd
            ON pd.projectdomainid=projects.projectdomain
            ORDER BY projects.projectsequence;`, (error, results) => {
            if (error) {reject(error)}
            resolve(results);
        });
    }); 
};

//used by manage projects page
const getSequenceNumber = () => {
    return new Promise(function(resolve, reject) { 
        pool.query("SELECT MAX(projectsequence) AS max_sequence FROM projects;", (error, results) => {
            if (error) {reject(error)}
            resolve(results.rows);
        });
    }); 
};

const getDomains = () => {
    return new Promise(function(resolve, reject) { 
        pool.query("SELECT * FROM projectdomains ORDER BY projectdomainname;", (error, results) => {
            if (error) {reject(error)}
            resolve(results.rows);
        });
    }); 
}

//used by manage projects page
const addProject = (projectID, projectDescription, projectSequence, projectDomain) => {
    let query = `
        INSERT INTO projects (
            projectid,
            projectdescription,
            projectsequence,
            projectdomain
        )
        VALUES (
            '${projectID}',
            $$${projectDescription}$$,
            '${projectSequence}',
            '${projectDomain}'
        );`;
    //accounts for situations where the domain is not specified.
    if (projectDomain === undefined || projectDomain === '' || isNaN(projectDomain)) {
        query = `
        INSERT INTO projects (
            projectid,
            projectdescription,
            projectsequence
        ) 
        VALUES (
            '${projectID}',
            $$${projectDescription}$$,
            '${projectSequence}'
        );`
    }

    return new Promise(function(resolve, reject) {
        pool.query(query, (error, results) => {
            if (error) {reject(error)}
            resolve(results);
        });
    });
};

const addDomain = (name, color) => {
    return new Promise((resolve, reject) => {
        pool.query(`
            INSERT INTO projectdomains (
                projectdomainname,
                projectdomaincolorhex
            ) 
            VALUES (
                $$${name}$$,
                '${color}'
            )`, (error, results) => {
                if (error) {reject(error)}
                resolve(results);
            }
        )
    })
}

//used by manage projects page
const editProject = (previousProjectID, newProjectSequence, newProjectID, newProjectDescription, newProjectDomain) => {
    return new Promise(function(resolve, reject) { 
        pool.query(`
            UPDATE projects
            SET 
                projectid='${newProjectID}',
                projectdescription=$$${newProjectDescription}$$,
                projectsequence='${newProjectSequence}',
                projectdomain='${newProjectDomain}'
            WHERE projectid='${previousProjectID}';`, (error, results) => {
            if (error) {reject(error)}
            resolve(results);
        });
    });
};

const editDomain = (id, name, color) => {
    return new Promise ((resolve, reject) => {
        pool.query(`
            UPDATE projectdomains
            SET 
                projectdomainname=$$${name}$$,
                projectdomaincolorhex='${color}'
            WHERE projectdomainid='${id}';`, (error, results) => {
                if (error) {reject(error)}
                resolve(results);
            })
    })
}
//used by manage projects page
const deleteProject = (projectID) => {
    let SqlQuery;
    if (projectID === "all") {SqlQuery = 'DELETE FROM projects;';}
    else {SqlQuery = `DELETE FROM projects WHERE projectid='${projectID}';`;}
    return new Promise(function(resolve, reject) { 
        pool.query(SqlQuery, (error, results) => {
            if (error) {reject(error);}
            resolve(results);
        });
    });
};

const deleteDomain = (id) => {
    return new Promise(function(resolve, reject) { 
        pool.query(`DELETE FROM projectdomains WHERE projectdomainid='${id}';`, (error, results) => {
            if (error) {reject(error);}
            resolve(results);
        });
    });
};

const resetProjectsTable = () => {
    return new Promise(function(resolve, reject) {
        pool.query(`
          DROP TABLE projects;
          CREATE TABLE projects (
            projectsequence INT,
            projectid VARCHAR,
            projectdescription VARCHAR,
            projectdomain INT
        );`, (error, results) => {
            if (error) {resolve({"result":500})}
            if (results) {resolve({"result":200})}
        })
      })
}
module.exports = {
    getProjects,
    getSequenceNumber,
    getDomains,
    addProject,
    addDomain,
    editProject,
    editDomain,
    deleteProject,
    deleteDomain,
    resetProjectsTable
}
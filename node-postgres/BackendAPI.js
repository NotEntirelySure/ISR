/*
  The dotenv library allows access to .env file for environment variable declaration.
  For server functionality, the path must be specified.
  Uncomment the import with the specified path. This must be done in all imported model files as well.
*/
//require('dotenv').config({path:'C:/inetpub/isr/api/.env'});
require('dotenv').config();

const express = require('express');
const fs = require('fs');
const https = require('https');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const auth_model = require('./auth_model');
const offices_model = require('./offices_model');
const ideas_model = require('./ideas_model');
const voter_model = require('./voter_model');
const votes_model = require('./votes_model');
const excel_model = require('./excel_model');
const participant_action_model = require('./participant_action_model');

const app = express().use('*', cors());

app.use(express.json());
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', process.env.API_ACCESS_CONTROL_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers');
  next();
});

//participants
app.get('/participants/getinfo/:token', (req, res) => {
  participant_action_model.getParticipantInfo(req.params.token)
  .then(response => res.status(200).send(response))
  .catch(error => res.status(500).send(error));
  });
  
app.get('/participants/getall/:token', (req, res) => {
  voter_model.getAllParticipants(req.params.token)
  .then(response => res.status(200).send(response))
  .catch(error => res.status(500).send(error));
});

app.post('/participants/register', (req, res) => {
  participant_action_model.registerParticipant(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.post('/participants/login', (req, res) => {
  auth_model.userLogin(req.body.jwt)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.post('/participants/logout', (req, res) => {
  //checks if the participant is requesting their own logout or if the admin is doing it.
  if (req.body.source === "participant") participant_action_model.logoutParticipant(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));

  if (req.body.source === "admin") auth_model.participantLogout(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.delete('/participants/delete', (req, res) => {
  voter_model.deleteParticipant(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.delete('/participants/reset/:token', (req, res) => {
  voter_model.resetParticipantsTable(req.params.token)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

//offices
app.get('/offices/getall', (req, res) => {
  offices_model.getOffices()
  .then(response => res.status(200).send(response))
  .catch(error => res.status(500).send(error));
});

app.post('/offices/add', (req, res) => {
  offices_model.addOffice(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error))
});

app.delete('/offices/delete', (req, res) => {
  offices_model.deleteOffice(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

//ideas
app.get('/ideas/getall/:token', (req, res) => {
  ideas_model.getIdeas(req.params.token)
  .then(response => res.status(200).send(response))
  .catch(error => res.status(500).send(error))
});

app.get('/ideas/getsequencenumber', (req, res) => {
  ideas_model.getSequenceNumber()
  .then(response => res.status(200).send(response))
  .catch(error => res.status(500).send(error));
});

app.post('/ideas/add', (req, res) => {
  ideas_model.addIdea(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error))
});

app.post('/ideas/edit', (req, res) => {
  ideas_model.editIdea(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error))
});

app.delete('/ideas/delete', (req, res) => {
  ideas_model.deleteIdea(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.delete('/ideas/reset/:token', (req, res) => {
  ideas_model.resetIdeasTable(req.params.token)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

//votes
app.get('/votes/getbyoffice/:data', (req, res) => {
  votes_model.getVotesByOffice(req.params.data)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.get('/votes/getall/:token', (req, res) => {
  votes_model.getAllVotes(req.params.token)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.get('/votes/check/:data', (req,res) => {
  votes_model.checkVote(req.params.data)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});
  
app.get('/votes/getparticipanthistory/:token', (req,res) => {
  participant_action_model.getVoteHistory(req.params.token)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.post('/votes/cast', (req, res) => {
  participant_action_model.castVote(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.post('/votes/add', (req, res) => {
  votes_model.addVote(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error))
});

app.post('/votes/edit', (req, res) => {
  votes_model.editVote(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.delete('/votes/delete', (req, res) => {
  votes_model.deleteVote(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.delete('/votes/deleteall', (req, res) => {
  votes_model.deleteAllVotes(req.body.token)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.delete('/votes/reset/:token', (req, res) => {
  votes_model.resetVoteTable(req.params.token)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.delete('/votes/resetlogs/:token', (req, res) => {
  votes_model.resetLogTable(req.params.token)
  .then(response => res.status(200).send(response))
  .catch(error => res.status(500).send(error));
});

//change logs
app.get('/changelogs/getall/:token', (req,res) => {
  votes_model.getAllChangeLogs(req.params.token)
  .then(response => res.status(200).send(response))
  .catch(error => res.status(500).send(error));
});

app.get('/changelog/getbyid/:data', (req,res) => {
  votes_model.getChangeLogById(req.params.data)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

//domains
app.get('/domains/getall/:token', (req,res) => {
  ideas_model.getDomains(req.params.token)
  .then(response => res.status(200).send(response))
  .catch(error => res.status(500).send(error));
});

app.post('/domains/add', (req, res) => {
  ideas_model.addDomain(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.post('/domains/edit', (req, res) => {
  ideas_model.editDomain(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.delete('/domains/delete', (req, res) => {
  ideas_model.deleteDomain(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
})

//miscellaneous
app.post('/login/admin', (req, res) => {
  auth_model.adminLogin(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.get('/verifyjwt/:token', (req, res) => {
  auth_model.verifyJwt(req.params.token)
  .then(response => res.status(200).send(response))
  .catch(error => res.status(500).send(error));
});

app.get('/export/excelchart/:data', (req, res) => {
  excel_model.exportExcel(req.params.data)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

//http server
app.listen(process.env.API_LISTENING_PORT, () => {
  console.log(`Postgres API running on port ${process.env.API_LISTENING_PORT}.`)
})

//https server
// https.createServer(
  //   {
  //     pfx:fs.readFileSync('C:/inetpub/isr/www_isrvote_com_pfx.pfx'),
  //     passphrase:'2J[F#41CRx.zF3//'
  //   },
//   app
// ).listen(`Secure postgres API listening on port ${process.env.API_LISTENING_PORT}`)
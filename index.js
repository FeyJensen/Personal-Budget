const express = require('express')
const app = express()
const { Envelope } = require('./envelopeObject.js');
let bodyParser = require('body-parser');
require('dotenv').config();
const { Pool } = require('pg');
const { env } = require('process');
//console.log(process.env);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

//get all envelopes
app.get('/', async(req, res) => {
  const results = await pool.query('SELECT * FROM envelopes');
  console.table(results.rows);
  if (results.rows.length === 0) {
    res.status(400).send('Not Found');
    return;
  }
  if(results) {
    res.send({'rows':results.rows});
  }
  else {
    res.status(400).send('Not Found');
  }
})


//get one by id
app.get('/:id', async(req, res) => {
  const resultsFound = await pool.query('SELECT * FROM envelopes WHERE id = $1', [req.params.id]);
  console.table(resultsFound.rows);
  if (resultsFound.rows.length === 0) {
    res.status(400).send('Not Found');
    return;
  }
  if(resultsFound) {
  res.send({'rows':resultsFound.rows});
  }
  else {
    res.status(400).send('Not Found');
  }
})

//creates envelope
app.post('/envelopes', bodyParser.json(), async(req, res) => {
  const validQuery = await pool.query('INSERT INTO envelopes (name, balance) VALUES ($1, $2) RETURNING *', [req.body.name, req.body.balance]);
  console.table(validQuery.rows);

  if(validQuery) {
    res.status(201).send('Envelope Added');

  }
  else {
    res.status(400).send('Invalid Entry');
  }
  
});

//transfer money from one envelope to another
app.post('/envelopes/transfer', bodyParser.json(), async(req, res) => {
  const { from, to, amount } = req.body;
  if (from === to) {
    res.status(400).send('Cannot transfer money to the same envelope');
    return;
  }
  const envelopeFromQuery = await pool.query('SELECT * FROM envelopes WHERE name = $1', [from]);
  const envelopeToQuery = await pool.query('SELECT * FROM envelopes WHERE name = $1', [to]);
  if(envelopeFromQuery.rowCount > 0 && envelopeToQuery.rowCount > 0) {
    if (envelopeFromQuery.rows[0].balance < amount) {
      res.status(409).send('Not enough money in the envelope');
      return;
    }
  
  const envelopeFromQueryAmount = envelopeFromQuery.rows[0].balance - amount;
  const envelopeToQueryAmount = envelopeToQuery.rows[0].balance + amount;

    await pool.query('UPDATE envelopes SET balance = $1 WHERE name = $2', [envelopeFromQueryAmount, from])
    await pool.query('UPDATE envelopes SET balance = $1 WHERE name = $2', [envelopeToQueryAmount, to])
      .then(() => res.status(200).send(`Success. You have transferred ${amount} dollars from ${from} to ${to}`))
      .catch(err => res.status(500).send('Error updating balances'));
    
  }
  else {
    res.status(400).send('One or both envelopes not found');
  }

})

//removes money from specific envelope and updates balance
app.put('/envelopes', bodyParser.json(), async(req, res) => { 
  const { name, amount } = req.body;
  const envelopeFound = await pool.query('SELECT * FROM envelopes WHERE name = $1', [name]);
  if(envelopeFound.rowCount > 0) {
    const currentBalance = envelopeFound.rows[0].balance;
    if (currentBalance >= amount) {
      const newBalance = currentBalance - amount;
      pool.query('UPDATE envelopes SET balance = $1 WHERE name = $2', [newBalance, name])
        .then(() => res.status(200).send(`Success. You now have ${newBalance} dollars in this envelope`))
        .catch(err => res.status(500).send('Error updating balance'));
    } else {
      res.status(409).send('Not enough money in the envelope');
    }
  }
  else {
    res.status(400).send('Envelope not found');
  }
})

app.delete('/envelopes/:id', bodyParser.json(), async(req, res) => {
  const resultsFound = await pool.query('DELETE FROM envelopes WHERE id = $1', [req.params.id])
  console.log(resultsFound);
    if (resultsFound.rowCount > 0) {
      res.status(200).send('Deleted');
    }
    else {
      res.status(400).send('Not Found');
    }
})


app.listen(3000, () => {
  console.log('Server has started')
})
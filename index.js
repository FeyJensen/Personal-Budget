const express = require('express')
const app = express()
const { Envelope } = require('./envelopeObject.js');
let bodyParser = require('body-parser');

let envelopeArr = []

app.get('/', (req, res) => {
  res.send(envelopeArr)
})

//get one by id
app.get('/:id', (req, res) => {
  //go through array and find the one with the matching id
  let itemRequestedFound = envelopeArr.find((element) => {
    if (element.id === Number(req.params.id)) {
      return element
    }
  })
  if (itemRequestedFound) {
    res.send(itemRequestedFound);
  }
  else {
    res.status(400).send('Not Found');
  }
})

//creates envelope
let id = 0;
app.post('/envelopes', bodyParser.json(), (req, res) => {
  id = id + 1;
  let newEnvelope = new Envelope(req.body.name, req.body.budget, id);
  if (newEnvelope) {
    envelopeArr.push(newEnvelope);
    res.status(201).send('Envelope Added')
  }
  else {
    res.status(400).send();
  }
});

app.post('/envelopes/transfer/:from/:to', bodyParser.json(), (req, res) => {
  let envelopeFrom = envelopeArr.find((element) => element.name === req.params.from)
  let envelopeTo = envelopeArr.find((element) => element.name === req.params.to)
  let amount = req.body.amount;
  //only take money out if there is enough
  if ((envelopeFrom.budget - amount) >= 0) {
    envelopeFrom.budget = envelopeFrom.budget - amount;
    envelopeTo.budget = envelopeTo.budget + amount;
    res.status(201).send('Budget updated');
  }
  else {
    res.status(409).send('Not enough money in the envelope');
  }

})

//removes money from specific envelope and updates balance
app.put('/envelopes', bodyParser.json(), (req, res) => {

  let itemRequestedFound = envelopeArr.find((element) => {
    if (element.name === req.body.name)
      return element
  })

  let amount = req.body.amount;
  if (itemRequestedFound) {
    if ((itemRequestedFound.budget - amount) >= 0) {
      itemRequestedFound.budget = itemRequestedFound.budget - amount;
      res.status(201).send(`Success. You now have ${itemRequestedFound.budget} dollars in this envelope`);
    }
    else {
      res.status(409).send('Not enough money in the envelope');
    }
  }

  else {
    res.status(400).send('Not Found');
  }
})

app.delete('/envelopes/:id', bodyParser.json(), (req, res) => {
  let envelopeArrLength1 = envelopeArr.length
  let userId = Number(req.params.id);
  envelopeArr = envelopeArr.filter((Envelope) => Envelope.id !== userId);
  let envelopeArrLength2 = envelopeArr.length
  if(envelopeArrLength1 != envelopeArrLength2){ 
    res.status(200).send('Deleted')
  }
  else{
    res.status(400).send('Not Found');
  }
  
})


app.listen(3000, () => {
  console.log('Server has started')
})
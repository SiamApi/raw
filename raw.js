const axios = require('axios');
const express = require('express');
const fs = require('fs');
const moment = require('moment-timezone');
const app = express();

//-------  DHAKA TIME -------//
const tz = moment.tz.guess(); // get the user's timezone
const userTime = moment.tz(Date.now(), tz);
const dhakaTime = userTime.format('YYYY-MM-DD HH:mm:ss');
//----------------------------//

class Submission {
  constructor(user, target, amount) {
    this.user = user;
    this.target = target;
    this.amount = amount;
  }
}

app.use(express.json());

app.post('/submit', async (req, res) => {
  const data = req.body;
  const user = data.user;
  const target = data.target;
  const amount = data.amount;

  let history = {};
  if (fs.existsSync('history.json') && fs.statSync('history.json').size !== 0) {
    history = JSON.parse(fs.readFileSync('history.json'));
  }

  const submission = { target: target, amount: amount, time: dhakaTime };
  if (!history[user]) {
    history[user] = { 1: submission };
  } else {
    const index = Object.keys(history[user]).length + 1;
    history[user][index] = submission;
  }

  fs.writeFileSync('history.json', JSON.stringify(history));

  // Upload the history.json file to GitHub
  const url = 'https://api.github.com/repos/siamapi/user-history/contents/users/history.json';
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': 'Bearer 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',
    'User-Agent': 'MyBot/1.0'
  };
  const sha = await getSha(headers, url);
  const content = fs.readFileSync('history.json');
  const data2 = {
    message: 'Update history.json',
    content: content.toString('base64'),
    sha: sha
  };
  try {
    const res2 = await axios.put(url, data2, { headers: headers });
    if (!res2.status === 200) {
      console.error(res2);
      throw new Error('Error uploading file to GitHub.');
    }
  } catch (error) {
    console.error(error);
    throw new Error('Error uploading file to GitHub.');
  }

  res.json({ message: 'Submission saved successfully.' });
});

async function getSha(headers, url) {
  const res = await axios.get(url, { headers: headers });
  if (!res.status === 200) {
    console.error(res);
    throw new Error('Error getting file from GitHub.');
  }
  return res.data.sha;
}

app.get('/getinfo', (req, res) => {
  const user = req.query.user;
  if (!user) {
    res.status(400).json({ error: 'User not specified.' });
    return;
  }

  let history = {};
  if (fs.existsSync('history.json') && fs.statSync('history.json').size !== 0) {
    history = JSON.parse(fs.readFileSync('history.json'));
  }

  if (!history[user]) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  res.json(history[user]);
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});

const night = require("./lib/nightstarlilly");
const key = require("./google.json");
const { google } = require("googleapis");

require("dotenv").config();

async function main() {
  const jwt = new google.auth.JWT(key.client_email, null, key.private_key, [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.readonly"
  ]);

  await jwt.authorize((err, auth) => {
    if (err) reject(err);
  });
  const search = await night.search({
    consumerKey: process.env.CONSUMER_KEY,
    consumerSecret: process.env.CONSUMER_SECRET,
    accessToken: process.env.ACCESS_TOKEN,
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET
  });
  night.registSchedule(jwt, search, process.env.CALENDAR_ID);
}

main().catch(err => console.error(err));

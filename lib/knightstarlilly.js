const Twitter = require("twitter");
const path = require("fs");
const { google } = require("googleapis");
const { DateTime, Settings } = require('luxon');

Settings.defaultZoneName = 'Asia/Tokyo'
const timeZone = Settings.defaultZoneName

const initial = {hours: 0, minutes: 0, second: 0, millisecond: 0}

function preProcessing(text) {
  return text
    .split("\n")
    .filter(val => val.length != 0)
    .slice(1)
    .map(text => {
      return text.split(/〜/g).map(t => t.replace(/https.+$/, ""));
    })
    .filter(val => val.length === 2);
}

async function search(oauth) {
  const todayString = `${new Date().getFullYear()}-${new Date().getMonth() +
    1}-${new Date().getDate()}`;
  console.log(todayString);
  const endPoint = "/search/tweets";
  const searchParams = {
    q: `"本日の配信スケジュール" from:amaryllis_class -rt since:${todayString}`,
    count: 5,
    tweet_mode: "extended"
  };
  const twitter = new Twitter({
    consumer_key: oauth.consumerKey,
    consumer_secret: oauth.consumerSecret,
    access_token_key: oauth.accessToken,
    access_token_secret: oauth.accessTokenSecret
  });
  const result = await twitter.get(endPoint, searchParams);
  return result.statuses.map(val => preProcessing(val.full_text))[0];
}

async function registSchedule(jwt, result, calendarId) {
  const today = DateTime.local().set(initial);
  const tommorow = DateTime.local().set(initial).plus({days: 1});
  const client = google.calendar("v3");
  client.events.list(
    {
      auth: jwt,
      calendarId,
      timeMin: today.toISO(),
      timeMax: tommorow.toISO(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime"
    },
    (err, data) => {
      if (err) console.error(err);
      data.data.items.map(val => {
        client.events
          .delete({ auth: jwt, calendarId, eventId: val.id })
          .catch(err => console.error(err));
      });
    }
  );
  for (const val of result ) {
    const start= val[0].split(":");
    const today = DateTime.local().set(initial);
    const startAt = today.set({hours: parseInt(start[0], 10), minutes: parseInt(start[1], 10)})
    await client.events.quickAdd({
      calendarId,
      auth: jwt,
      text: `${val[1]} at ${startAt.toSQL()} JST for 1 hours}`,
      sendNotifications: true
    });
  };
}

module.exports = {
  search,
  registSchedule
};

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const urlparser = require('url');
const dns = require('dns');
const { MongoClient } = require('mongodb');


//connection
const conn = process.env.db_conn;
const client = new MongoClient(conn);
const db = client.db('urlshortner');
const urls = db.collection('urls');

const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.urlencoded({extended: true}))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  originalUrl = req.body.url;

  // if (!/^https?:\/\//i.test(originalUrl)) {
  //   originalUrl = 'http://' + originalUrl;
  // }
  const hostname = urlparser.parse(originalUrl).hostname;
  dns.lookup(hostname, async(err, address) => {
    if(err || !address){
      res.json({
        error: "Invalid URL"
      })
    } else {
      try{
        const count = await urls.countDocuments({});
        shortUrl = count + 1;

        urls.insertOne({
          original_url: originalUrl,
          short_url: shortUrl
        })

        res.json({
          original_url: originalUrl,
          short_url: shortUrl
        })
      } catch(err){
        console.log(err);
      }
    }
  });
});

app.get('/api/shorturl/:shortUrl', async (req, res) => {
  try {
    const shurl = await urls.findOne({ short_url: shortUrl });
    
    if(shurl){
      res.redirect(shurl.original_url)
    }else{
      res.json({ error: "No URL found for this short URL" });
    }
  }catch(err){
    console.log(err)
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

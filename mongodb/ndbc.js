const {MongoClient} = require('mongodb');

const client = new MongoClient(process.env.MONGO_URL);

function mongodb(operations) {
  client.connect().then((mongo) => {
    const db = mongo.db(process.env.DB_NAME);
    operations(db);
  }).catch((error) => {
    console.error(`Database Connect Failed : ${error}`);
  })
}

module.exports = mongodb;
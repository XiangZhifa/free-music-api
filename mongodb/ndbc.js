const {MongoClient} = require('mongodb');

const client = new MongoClient(process.env.MONGO_URL);

function mongodb(operations) {
  client.connect().then(async (mongo) => {
    const db = mongo.db(process.env.DB_NAME);
    await operations(db);
  }).catch((error) => {
    console.error(`Error : ${error}`);
  })
}

module.exports = mongodb;
const {MongoClient} = require('mongodb');

const client = new MongoClient(process.env.MONGO_URL);
let db = null;

client.connect().then((mongo) => {
    db = mongo.db(process.env.DB_NAME);
    console.log('Database Connect Success.');
}).catch((error) => {
    console.log(`Database Connect Failed : ${error}`);
});

module.exports = {
    client,
    db
};
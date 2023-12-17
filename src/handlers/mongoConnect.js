const mongoose = require('mongoose');

mongoose.set("strictQuery", false);
mongoose.connect(global.config["mongoConnect"])

mongoose.connection.on('connected', function() {
    console.log("Mongo server successfully connected!")
})

mongoose.connection.on('error', function(e) {
    console.log(`Mongo server failed connected: ${e}`);
});
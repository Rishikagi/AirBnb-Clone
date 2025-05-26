const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");


const Mongoose = "mongodb://127.0.0.1:27017/airbnb";
async function main() {
    await mongoose.connect(Mongoose);
    
}
main().then(()=>{
    console.log("Connected to DB");
    
}).catch((err)=>{
    console.log(err);
    
});
const init = async ()=>{
    // await Listing.deleteMany({});
    initData.data = initData.data.map((obj)=>({...obj ,owner:'67daca3a964d557b13c12488'}));
    await Listing.insertMany(initData.data);
    console.log("Data initialised");
};
init();
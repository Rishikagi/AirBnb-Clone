
const mongoose = require("mongoose");
const schema = mongoose.Schema;
const reviewSchema = new schema({
    comment:{
        type: String,
    },
    ratings:{
        type: Number,
        min: 1,
        max: 5,
        required:true,
        default: 2,
    },
    createdAt:{
        type: Date,
        default: Date.now(),
    },
    author :{
        type : mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
});
const review = mongoose.model("Review", reviewSchema)
module.exports = review;
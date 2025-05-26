const mongoose = require("mongoose");

const Review = require("./review.js");
const schema = mongoose.Schema;
const listingSchema = new schema({
   
    title:{
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    image:{
        
        url:  String,
        filename:  String,
            
     
        // default: "https://plus.unsplash.com/premium_photo-1689609950112-d66095626efb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8aG9tZXxlbnwwfHwwfHx8MA%3D%3D" ,
        // set: (v) => {
        //     // If the value is empty string, null, or undefined, use the default image
        //     return (v === "" || v === null || v === undefined)
        //       ? "https://plus.unsplash.com/premium_photo-1689609950112-d66095626efb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8aG9tZXxlbnwwfHwwfHx8MA%3D%3D"
        //       : v;
        //   }
        },
    price: {
        type: Number,
        min: [100, 'Price must be greater than or equal to 0'], // Minimum value constraint
        required: true,
    },
    location:{
        type:String,
        required: true,
    },
    
    country: {
        type: String,
        required: true,
    },
    reviews:[{
        type: schema.Types.ObjectId,
        ref: "Review"
    },],
    owner: {
        type: schema.Types.ObjectId ,
        ref: 'User',
        required: true // Ensure every listing has an owner
    },
    geometry:  {
        type: {
          type: String, // Don't do `{ location: { type: String } }`
          enum: ['Point'], // 'location.type' must be 'Point'
          required: true
        },
        coordinates: {
          type: [Number],
          required: true
        }
      }
});
listingSchema.post("findOneAndDelete", async(listing)=>{
    await Review.deleteMany({_id :{$in: listing.reviews}});
})
const listing = mongoose.model("Listing",listingSchema);
module.exports = listing;

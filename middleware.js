
const Listing = require("./models/listing");
const mongoose = require("mongoose"); 
module.exports.isLoggedin = (req,res,next)=>{
    if(!req.isAuthenticated()){
       
       // redirect url save
       req.session.redirectUrl = req.originalUrl ;
    //    console.log(req.session.redirectUrl);
        req.flash("error", "You must be logged In!!");
       return  res.redirect("/login");
    }
    next();
}

module.exports.saveredirectUrl = (req,res,next)=>{
    if(req.session.redirectUrl ){
        res.locals.redirectUrl = req.session.redirectUrl ;
        
        delete req.session.redirectUrl; // Clear redirect URL after use
    }
    next();
}

// allowing only owner to add changes



module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    if (!res.locals.currUser || !listing.owner.equals(new mongoose.Types.ObjectId(res.locals.currUser._id))) {
        req.flash("error", "You don't have permission to edit!");
        return res.redirect(`/listings/${id}`);
    }
    
    next();
};
    

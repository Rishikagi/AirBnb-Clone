// credentials details in env for cloud storage
if(process.env.NODE_ENV != "production"){

    require('dotenv').config();
}
// console.log(process.env.CLOUD_NAME);
let maptoken = process.env.MAP_TOKEN;
// console.log(maptoken);
   const express = require("express");
const mongoose = require("mongoose");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utilities/wrapAsync.js");
const ExpressError = require("./utilities/expressError.js");
const {listingSchema} = require("./schemaJoi.js");
const session = require('express-session');
const MongoStore = require("connect-mongo");
const MongoDBStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash');
const passport= require("passport");
const localStrategy= require("passport-local");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const cloudinary = require('cloudinary').v2;

const {storage}= require("./cloudconfig.js");
const upload = multer({storage});
// console.log("Storage Config:", storage);
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken});





const {isLoggedin, isOwner} = require("./middleware.js");
const {saveredirectUrl} = require("./middleware.js");
const User = require("./models/user.js");
const listing = require("./models/listing");
app.set("views",path.join(__dirname,"views"));
app.set("view engine","ejs");
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));
// app.use("cookieParser"());

const review = require("./models/review.js");
const { log } = require('console');


port = 8080;
app.listen(port,()=>{
    console.log("App is Listining");
});

// Mongoose = "mongodb://127.0.0.1:27017/airbnb"; 
Mongoose = process.env.ATLAS_URL;  


try {
  



async function main() {
    await mongoose.connect(Mongoose);
} 
main().then(()=>{
    console.log("connection is built")
}).catch(err=>{
    console.log("error")});

const validateListing = ((req,res,next)=>{
    let  result = listingSchema.validate(req.body);
    if(result.error){
        throw new ExpressError(400,"kindly Provide all valid Information.")
    }else{
        next();
    }
});
const store= MongoStore.create({
    mongoUrl: Mongoose,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter: 24 * 3600 ,
});

const sessionOption= {
    store,
    secret: process.env.SECRET, // Secret key for session
    resave: false,
    saveUninitialized: true,
    cookie:{
        expires : Date.now() + 7 * 24 * 60* 60 * 1000,
        maxAge: 7*24*60*60*1000,
        httpOnly: true
    },
};



app.use(session(sessionOption));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(flash());
app.use((req, res, next) => {
    // console.log("Current User:", req.user); // Debugging
    res.locals.success = req.flash('success');
    res.locals.error= req.flash('error');
    res.locals.currUser = req.user || null;
    
    next();
  });




//index route    
    app.get("/listings",wrapAsync(async(req,res)=>{
        const allListing= await listing.find({});
        // console.log("Fetched Listings:", allListing);
        res.render("./listings/index.ejs",{allListing});
}));
//new route
app.get("/listings/new",isLoggedin,wrapAsync(async (req,res)=>{
    
    res.render("./listings/new.ejs");
}));
//show route
app.get("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    
    // Find listing and populate necessary fields
    const Listing = await listing.findById(id)
        .populate({
            path: "reviews",
            populate: { path: "author" }
        })
        .populate("owner");

    if (!Listing) {
        req.flash("error", "Listing Not Found");
        return res.redirect("/listings");
    }

    // Check if listing already has coordinates
    if (!Listing.geometry || !Listing.geometry.coordinates.length) {
        try {
            // Perform forward geocoding only if coordinates are missing
            let response = await geocodingClient.forwardGeocode({
                query: Listing.location, // Corrected from req.body.listing.location
                limit: 1
            }).send();

            if (response.body.features.length > 0) {
                Listing.geometry = response.body.features[0].geometry;
                await Listing.save(); // Save updated geometry to the database
            } else {
                Listing.geometry = { type: "Point", coordinates: [0, 0] };
                req.flash("error", "Location not found. Using default coordinates.");
            }
        } catch (error) {
            console.error("Geocoding error:", error);
            req.flash("error", "Geocoding service unavailable.");
        }
    }

    let coordinates = Listing.geometry.coordinates;
    console.log("Listing Coordinates (Server):", coordinates);

    res.render("./listings/show.ejs", { Listing, maptoken, coordinates });
}));


//create route
app.post("/listings", 
    isLoggedin, 
    upload.single("listing[image]"), 
    validateListing, 
    wrapAsync(async (req, res, next) => {
        try {
            // Ensure listing data exists
            if (!req.body.listing) {
                req.flash("error", "Listing data is missing.");
                return res.redirect("/listings");
            }

            // Check if file upload failed
            if (!req.file) {
                req.flash("error", "File upload failed. Kindly provide all information.");
                return res.redirect("/listings");
            }

            // Perform forward geocoding to get coordinates
            let response = await geocodingClient.forwardGeocode({
                query: req.body.listing.location,
                limit: 1
            }).send();

            
           

            // Create and save listing
            const newListing = new listing(req.body.listing);
            newListing.owner = req.user._id;
            newListing.image = {
                url: req.file.path,       // Cloudinary URL
                filename: req.file.filename // Cloudinary Filename
            };

            // Assign coordinates if found, otherwise use default
            if (response.body.features.length > 0) {
                newListing.geometry = response.body.features[0].geometry;
                // console.log("Assigned Geometry:", newListing.geometry);
            } else {
                newListing.geometry = { type: "Point", coordinates: [0, 0] };
                req.flash("error", "Location not found. Using default coordinates.");
            }

            // Save listing **after** setting geometry
            await newListing.save();

            req.flash("success", "New Listing Added");
            res.redirect("/listings"); // Redirect to the listings page

        } catch (error) {
            console.error("Error saving listing:", error);
            req.flash("error", "An error occurred while saving the listing.");
            res.redirect("/listings");
        }
    })
);


// update route

app.put("/listings/:id", isLoggedin, upload.single("listing[image]"), 
    isOwner, validateListing,  wrapAsync(async (req,res)=>{
    let {id} = req.params;
    console.log("Requested ID:", req.params.id); 
    let editedListing = await listing.findByIdAndUpdate(id,{...req.body.listing});
    if (!editedListing ){
        req.flash("error" , "not updated");
    }
 
    if(typeof req.file !== "undefined"){
    let url = req.file.path;     // Cloudinary URL
    let filename = req.file.filename ;//  Cloudinary Filename
    editedListing.image = {url , filename };
    
    await editedListing.save();
    }
    req.flash("success","Listing Updated");
    res.redirect(`/listings/${id}`);
}));

//edit route

app.get("/listings/:id/edit", isLoggedin , isOwner, wrapAsync(async(req,res)=>{
    let{id} = req.params;
    const editedListing = await listing.findById(id);
    res.render("./listings/edit.ejs",{editedListing});
}));

//delete route

app.delete("/listings/:id",isLoggedin,isOwner , wrapAsync(async(req,res)=>{
    let {id} = req.params;
    
    let deletedListing = await listing.findByIdAndDelete(id);
    req.flash("success"," Listing Deleted");
    res.redirect("/listings");
}));


// app.get("/",wrapAsync (async(req,res)=>{
//     await res.send("Hi I Am Root");
// }));

//reviews
//post route
app.post("/listings/:id/reviews",isLoggedin, async(req,res)=>{
    let listings = await listing.findById(req.params.id);
    let newReview = new review(req.body.review);
    newReview.author = req.user._id;
    
    
    listings.reviews.push(newReview);
    await newReview.save();
    await listings.save();
    
    
    req.flash("success","Your Review Is Added");
    res.redirect(`/listings/${listings._id}`);
});

// app.get("/demo",async(req,res)=>{
//     let fakeUser = new User({
//         email: "student@gmail.com",
//         username: "student",
//     });
//     let regisUser = await User.register(fakeUser,"helloworld");
//     res.send(regisUser);
// });

//authentication page
//login 
app.get("/login",async(req,res)=>{
    
    res.render("./users/login.ejs");
    });
app.post("/login",saveredirectUrl , 
    passport.authenticate("local",{
    failureRedirect:"/login",
    failureFlash: true,
}),
async(req,res)=>{
    // console.log("Authenticated User:", req.user);
    req.flash("success","You Are logged In successfully!");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
    
}
);
//signup
app.get("/signup",async(req,res)=>{
    
    res.render("./users/signup.ejs");
    });


// authentication demo - saving user
app.post("/signup", async(req,res)=>{
    try{
        let {username, email, password } = req.body;
    const newUser  = new User({username , email})
    const registeredUser = await User.register(newUser, password);
    req.login(registeredUser , (err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","You Are Registered successfully!");
         res.redirect("/listings");
    });
    
    } catch(e){
        
        req.flash("error","User Already Exists!");
        return res.redirect("/signup");
    }
    
});

// logout process
app.get("/logout" , (req,res,next)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success" , "You are successfully Logged Out!!");
        return res.redirect("/listings");
    });
});
//customError
app.all("*",(req,res,next)=>{
    next(new ExpressError(404, "Page not found"));
});
//midleware declaration


app.use((err,req,res,next)=>{
    let {statusCode = 500, message = "Something went wrong"} = err;
    res.render("error.ejs",{err});
    // res.status(statusCode).send(message);
        
});


app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log("Route:", r.route.path);
  }
});

    
    
    
    
    
    // app.get("/listing",async (req,res)=>{
    //     let sample = new listing({
    //         Title: "The Blue Alice",
    //         Price: 200,
       
    //         Discription: "Beautiful Place",
    //         location: "Delhi",
        
    //         Country: "India"
    
    //     });
    // await sample.save();
    // console.log("data saved");
    // res.send("Saved");
    //     });

    } catch (err) {
  console.error("Caught error:", err.message);
}

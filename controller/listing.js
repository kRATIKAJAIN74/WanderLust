const Listing = require("../models/listing");
module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("./listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("./listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("success", "Listing you requested does not exist");
    res.redirect("/listings");
  }
  res.render("./listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  try {
    let url = req.file?.path || "";
    let filename = req.file?.filename || "";
    let location = req.body.listing.location;

    //  API call
    const data = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        location
      )}`
    ).then((res) => res.json());

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    
    newListing.image = { url, filename };

    if (!data || data.length === 0) {
      //  geometry if not found
      newListing.geometry = {
        type: "Point",
        coordinates: [0, 0],
      };

      await newListing.save();
      req.flash(
        "error",
        "Location not found, default coordinates (0,0) used."
      );
      return res.redirect(`/listings/${newListing._id}`);
    }

    // Coordinates from API
    const firstResult = data[0];
    const lat = parseFloat(firstResult.lat);
    const lon = parseFloat(firstResult.lon);

    newListing.geometry = {
      type: "Point",
      coordinates: [lon, lat],
    };

    await newListing.save();
    req.flash("success", "New listing is created");
    res.redirect(`/listings/${newListing._id}`);
  } catch (err) {
    console.error("Error creating listing:", err);
    req.flash("error", "Something went wrong while creating the listing");
    res.redirect("/listings/new");
  }
};


module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if(!listing) {
    req.flash("error", "Listing you requested for does not exist.");
    res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
   originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");

   res.render("./listings/edit", { listing , originalImageUrl});
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);

  // If image field is missing or empty, preserve the old image object
  if (!req.body.listing.image || req.body.listing.image === "") {
    req.body.listing.image = listing.image;
  } else if (typeof req.body.listing.image === "string") {
    // If only URL is provided, update just the url property
    req.body.listing.image = {
      ...listing.image,
      url: req.body.listing.image,
    };
  }

   await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  req.flash("success", " Listing Updated.");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res, next) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing is deleted");
  res.redirect("/listings");
};
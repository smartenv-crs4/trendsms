var Mongoose   = require('mongoose');
var Schema     = Mongoose.Schema;

var mongoosePaginate = require('mongoose-paginate');


// The data schema for a trend
var trendSchema = new Schema({
  // autocreated id field is implicit
  createdAt     : { type: Date,   required: false, default: Date.now }, // when the record is created
  idUser        : { type: String, required: false, trim: true },       // the id of the customer that did the search
  userType      : { type: String, required: false, trim: true },
  category      : { type: String, required: false, trim: true },       // the id of the category where search was performed
  keyword       : { type: String, trim: false },                       // the keyword/phrase used for the search
  results       : { type: Number, required: true,trim: true  },
  searchType    : { type: String, required: false, trim: true },        // number or results given by the search
  lang          : { type: String, required: false, trim: true }
},{
    versionKey: false // You should be aware of the outcome after set to false
});

trendSchema.plugin(mongoosePaginate);

var trend = Mongoose.model('Trend', trendSchema);

module.exports = {
  Trend: trend
};

// Load required packages
var mongoose = require('mongoose');

// Define our user schema
var UserSchema = new mongoose.Schema({
    // Users cannot be created (or updated) without a name or email.
    // All other fields that the user did not specify should be set to reasonable values.
    name: {type: String, required: true},
    // Multiple users with the same email cannot exist.
    email: {type: String, index: {unique: true}, required: true},
    pendingTasks: {type:[String], default:[]},
    dateCreated: {type: Date, default: Date.now}
});

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);

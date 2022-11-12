// Load required packages
var mongoose = require('mongoose');

// Define the task schema
var TaskSchema = new mongoose.Schema({
    // Tasks cannot be created (or updated) without a name or a deadline. 
    // All other fields that the user did not specify should be set to reasonable values.
    name: {type: String, required: true},
    description: {type: String, default: ""},
    deadline: {type: Date, required: true},
    completed: {type: Boolean, default: false},
    assignedUser: {type: String, default: ""},
    assignedUserName: {type: String, default: "unassigned"},
    dateCreated: {type: Date, default: Date.now}
});

// Export the Mongoose model
module.exports = mongoose.model('Task', TaskSchema);

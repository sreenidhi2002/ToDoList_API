/*
 * Connect all of your endpoints together here.
 */
module.exports = function (app, router) {
    app.use('/api', require('./home.js')(router));
    app.use('/api', require('./allUsers.js')(router));
    app.use('/api', require('./allTasks.js')(router));
};

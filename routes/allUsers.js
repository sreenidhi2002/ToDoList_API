var secrets = require('../config/secrets');

var userList = require('../models/user.js');
var taskList = require('../models/task.js');

module.exports = function (router) {

	var routeForAllUsers = router.route('/users');
	var routeForUserId = router.route('/users/:id');

	// GET request
    routeForAllUsers.get(function(request, serverResponse) {
		userList.find(eval("(" + request.query.where + ")"))
		.sort(eval( "(" + request.query.sort + ")"))
		.select(eval("(" + request.query.select + ")"))
		.skip(eval("(" + request.query.skip + ")"))
		.limit(eval("(" + request.query.limit+ ")"))
		.exec()
		.then((users) => {
			// GET request only wants the count of the data found - returns only count
			if (request.query.count) {
				return serverResponse.status(200).send({message: 'Successfully found specified users, displaying count', data: users.length});
			} else {
				// GET request wants the actual data that was found - returns the actual data members
				return serverResponse.status(200).send({message: 'Successfully found specified users, displaying information about users', data: users});
			}
		})
		.catch((err) => {
			return serverResponse.status(500).send({message: 'SERVER ERROR - Unable to retrieve users', data: []});
		});
	});


	// POST request
	routeForAllUsers.post(function(request, serverResponse) {
		var userToAdd = new userList();
		userToAdd.email = request.body.email;
		userToAdd.name = request.body.name;

		if (request.body.pendingTasks) {
			userToAdd.pendingTasks = request.body.pendingTasks;
		} else {
			userToAdd.pendingTasks = [];
		}
		
		userList.findOne({email: request.body.email})
		.then((user) => {
			if (user != null) { 
				// user already exists
				return serverResponse.status(500).send({message: 'User with this email already exists', data: []});
			} else {
				// email is unique so user can be created
				userToAdd.save()
				.then(() => {
					return serverResponse.status(201).send({message: 'New user created', data: userToAdd});
				})
				.catch((err) => {
					return serverResponse.status(500).send({message: 'Unable to create user - check to see that both name and email have been specified for a new user to be created', data: []});
				});
			}
 		})
		.catch((err) => {
			return serverResponse.status(500).send({message: 'SERVER ERROR - unable to create user', data: []});
		});
	});

	// For each user

	// GET request for a particular user
    routeForUserId.get(function(request, serverResponse) {
		userList.findById(request.params.id)
		.select(eval("(" + request.query.select + ")"))
		.exec()
		.then((new_user) => {
			if (new_user != null) {
				return serverResponse.status(200).send({message: 'Success! User found', data: new_user});
			} else {
				return serverResponse.status(404).send({message: 'Not found - user', data:[]});
			}
		})
		.catch((err) => {
			return serverResponse.status(500).send({message: 'SERVER ERROR - Unable to retrieve specified user', data:[]});
		});
	});

	// PUT request for a particular user
	routeForUserId.put(function(request, serverResponse) {
		userList.findById(request.params.id).exec()
		.then((updated_user) => {
			if (updated_user != null) {
				
				updated_user.email = request.body.email;
				updated_user.name = request.body.name;
				
				// If new pending tasks have been assigned, set it to the user's profile
				if (request.body.pendingTasks != null) {
					//user cannot have duplicate tasks
					updated_user.pendingTasks = request.body.pendingTasks;
				}
				
				var len = updated_user.pendingTasks.length;
				console.log("new call");
				console.log("num pending: ", len);
				var list_tasks = updated_user.pendingTasks;

				var updated_user_put_task = {
					assignedUser: updated_user._id,
					assignedUserName: updated_user.name
				}

					var to_update = [];
					for (var i = 0; i < len; i++) {
						console.log("pending task [i]: ", list_tasks[i]);
						to_update.push(taskList.findByIdAndUpdate(list_tasks[i], {$set: updated_user_put_task}, {new: true}));
					}
					Promise.all(to_update)
					// .then(() => {
					// 	return serverResponse.status(200).send({message:"User has been updated successfully and pending tasks assigned", data: []});
					// })
					.catch((err) => {
						return serverResponse.status(200).send({message:"User updated. Error assigning pending tasks.", data: []});
					});
				
				// Save the new user info in the user table
				updated_user.save()
				.then(() => {
					return serverResponse.status(200).send({message: 'User information has been updated successfully', data: []});
				})
				.catch((err) => {
					return serverResponse.status(500).send({message: 'Issue updating user information, ensure that both name and email are valid and inputted', data: []});
				});
			} else {
				return serverResponse.status(404).send({message: "Not found - user", data:[]});
			}
		})
		.catch((err) => {
			return serverResponse.status(500).send({message: 'Server Error - User not found', data:[]});
		});
		
	});


	// DELETE request for a particular user
	routeForUserId.delete(function(request, serverResponse) {
		userList.findByIdAndRemove(request.params.id).exec()
		.then((user_to_delete) => {
			if (user_to_delete == null) {
				return serverResponse.status(404).send({message: 'Not found - user', data:[]});
			} else {

				var updated_user = {
					assignedUser: "",
					assignedUserName: "unassigned"
				}

				if (user_to_delete.pendingTasks.length != 0) {

					//console.log("length ", user_to_delete.pendingTasks.length);
					var to_unassign = [];
					for (var i = 0; i < user_to_delete.pendingTasks.length; i++) {
						to_unassign.push(taskList.findByIdAndUpdate(user_to_delete.pendingTasks[i], {$set: updated_user}, {new: true}));
					}
					Promise.all(to_unassign)
					.then(() => {
						return serverResponse.status(200).send({message:"User has been deleted successfully and pending tasks unassigned", data: user_to_delete});
					})
					.catch((err) => {
						return serverResponse.status(200).send({message:"User deleted. Error unassigning pending tasks.", data: user_to_delete});
					});
				} else {
					return serverResponse.status(200).send({message: 'User has been deleted successfully, no pending tasks to be unassigned', data: []});
				}
				
			}
		})
		.catch((err) => {
			return serverResponse.status(500).send({message: 'Error when attempting to delete user', data:[]});
		});
	});

    return router;
}
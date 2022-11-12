var secrets = require('../config/secrets');
var taskList = require('../models/task.js');
var userList = require('../models/user.js');

module.exports = function (router) {

    var allTasks = router.route('/tasks');
    var specificTask = router.route('/tasks/:id');

    // All tasks

    // GET request
    allTasks.get(function(request, serverResponse) {
        taskList.find(eval("(" + request.query.where + ")"))
        .select(eval("(" + request.query.select + ")"))
        .sort(eval("(" + request.query.sort + ")"))
        .limit(eval("(" + request.query.limit + ")"))
        .skip(eval("(" + request.query.skip + ")"))
        .exec()
        .then((tasks_retrieved) => {
            // GET request only wants the count of the data found - returns only count
            if (request.query.count) {
                return serverResponse.status(200).send({message: 'Displaying task count', data: tasks_retrieved.length});
            } else {
                // GET request wants the actual data that was found - returns the actual data members
                return serverResponse.status(200).send({message: 'Displaying information about tasks', data: tasks_retrieved});
            }
            
        })
        .catch((err) => {
            return serverResponse.status(500).send({message: "Tasks not found", data:[]});
        });
    });


	allTasks.post(function(request, serverResponse) {
		var taskToAdd = new taskList();
        var info = request.body;

        // Required
		taskToAdd.name = info.name;
		taskToAdd.description = info.description;

        // Optional for post
        taskToAdd.completed = info.completed;
        taskToAdd.assignedUser = info.assignedUser;
		taskToAdd.assignedUserName = info.assignedUserName;
		taskToAdd.deadline = info.deadline;

		taskToAdd.save()
		.then(() => {
			return serverResponse.status(201).send({message: 'New task created:', data: taskToAdd});
		})
		.catch((err) => {
			return serverResponse.status(500).send({message: "Error creating new task", data:[]});
		});
	});


    // GET request for a particular task
    specificTask.get(function(request, serverResponse) {
        taskList.findById(request.params.id).exec()
        .then((task_found) => {
            if (task_found != null) {
                return serverResponse.status(200).send({message: 'Displaying task data', data: task_found});
            } else {
                return serverResponse.status(404).send({message: 'Could not find task', data:[]});
            }
        })
        .catch((err) => {
            return serverResponse.status(500).send({message: 'SERVER ERROR - error getting task', data:[]});
        });
    });

    // PUT request for a particular task
    specificTask.put(function(request, serverResponse) {
        taskList.findById(request.params.id).exec()
        .then((task) => {
            if (task == null) {
                return serverResponse.status(404).send({message: 'Task not found', data:[]});
            } else {
                task.name = request.body.name;
                task.description = request.body.description;
                task.deadline = request.body.deadline;
                task.completed = request.body.completed;
                task.assignedUser = request.body.assignedUser;
                task.assignedUserName = request.body.assignedUserName;
                task.save()
                .then((result) => {
                    if (request.body.assignedUser != null) {
                        if (request.body.completed == true) {
                            userList.findByIdAndUpdate(request.body.assignedUser, {$pull: {pendingTasks: result._id}})
                            .then(() => {
                                return serverResponse.status(200).send({message:"Task updated and removed from user's pending tasks", data: task});
                            })
                            .catch((err) => {
                                return serverResponse.status(500).send({message:"Unable to find assigned user and remove task - task update failed", data: task});
                            });
                        } else {
                            userList.findByIdAndUpdate(request.body.assignedUser, {$push: {pendingTasks: result._id}})
                            .then(() => {
                                return serverResponse.status(200).send({message:"Task updated and added to user's pending tasks", data: task});
                            })
                            .catch((err) => {
                                return serverResponse.status(500).send({message:"Unable to find assigned user and add task - task updated", data: task});
                            });

                        }
                    } else {
						return serverResponse.status(200).send({message:"Task successfully updated", data: task});
					}
                })
                .catch((err) => {
                    return serverResponse.status(500).send({message: err, data:[]});
                    //return serverResponse.status(500).send({message: 'Unable to update Task due to insufficient information', data:[]});

                });
            }
        })
        .catch((err) => {
            return serverResponse.status(500).send({message: 'Error when making new task', data:[]});
        });
    });


    // DELETE request for a particular task
    specificTask.delete(function(request, serverResponse) {

        taskList.findByIdAndRemove(request.params.id).exec()
        
        .then((task_to_delete) => {
            if (task_to_delete == null) {
                return serverResponse.status(404).send({message: 'Task not found', data:[]});
            } else {
                if (request.body.assignedUser != null) {
                    userList.findByIdAndUpdate(request.body.assignedUser, {$pull: {pendingTasks: task_to_delete._id}})
                    .then(() => {
                         return serverResponse.status(200).send({message:"Task deleted and removed from user's pending tasks", task_to_delete: result});
                    })
                    .catch((err) => {
                        return serverResponse.status(500).send({message:"Unable to find assigned user and remove task - task deleted", task_to_delete: result});
                    });
                } else {
                    return serverResponse.status(200).send({message: "Task Deleted", data: []});
                }
            }
        })
        .catch((err) => {
            return serverResponse.status(500).send({message: 'Error when attempting to delete task', data:[]});
        });
    });

    return router;
}





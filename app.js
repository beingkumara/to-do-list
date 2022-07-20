var express = require("express");
var bodyParser = require("body-parser");
var app = express();
const mongoose = require("mongoose");
const lodash = require("lodash");
// var items = ["Play cricket", "run"];
// var WorkItems = [];
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/todoDB", {
    useNewUrlParser: true,
});

const toDoSchema = mongoose.Schema({
    name: String,
});

const Item = mongoose.model("Item", toDoSchema);

const item1 = new Item({
    name: "Good Morning!",
});

const item2 = new Item({
    name: "Go for a run!",
});

const defaultItems = [item1, item2];
// Item.insertMany([item1, item2], function(err) {
//     if (err) {
//         console.log(err);
//     } else {
//         console.log("Sunccesfullt added!");
//     }
// });

const dynamicListSchema = mongoose.Schema({
    name: String,
    features: [toDoSchema],
});

const Dynamic = mongoose.model("Dynamic", dynamicListSchema);

app.get("/", function(request, response) {
    Item.find({}, function(err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany([item1, item2], function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Sunccesfullt added!");
                }
            });
            response.redirect("/");
        } else {
            response.render("list", { actualDay: "Today", listItems: foundItems });
        }
    });
});

app.get("/:dynamicLinkName", function(request, response) {
    const newDmain = lodash.upperFirst(request.params.dynamicLinkName);
    Dynamic.findOne({ name: newDmain }, function(err, objects) {
        if (!err) {
            if (!objects) {
                const newObj = new Dynamic({
                    name: newDmain,
                    features: defaultItems,
                });
                newObj.save();
                response.redirect("/" + newDmain);
            } else {
                response.render("list", {
                    actualDay: objects.name,
                    listItems: objects.features,
                });
            }
        }
    });

    // newObj.save();
});

app.post("/", function(request, response) {
    var newOne = request.body.toDo;
    var butVal = lodash.upperFirst(request.body.button);
    const newItem = new Item({
        name: newOne,
    });
    if (butVal === "Today") {
        newItem.save();
        response.redirect("/");
    } else {
        Dynamic.findOne({ name: butVal }, function(err, foundList) {
            if (!err) {
                foundList.features.push(newItem);
                foundList.save();
                response.redirect("/" + butVal);
            }
        });
    }

    //we cannot render here again. bonly render in the get method. so we use the user inputted data, and redirect it to the homepage and the get method cathces the data and sends it to the server which sends it to the browser
});

//you can always have multiple post and get methods for different routes

app.post("/delete", function(request, response) {
    const deleteItem = request.body.checkedItem;
    const deleteList = request.body.deleteList;
    if (deleteList === "Today") {
        Item.findByIdAndDelete(deleteItem, function(err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Deleted Item: " + deleteItem);
                response.redirect("/");
            }
        });
    } else {
        Dynamic.findOneAndUpdate({ name: deleteList }, {
                $pull: { features: { _id: deleteItem } },
            },
            function(err, foundList) {
                if (!err) {
                    response.redirect("/" + deleteList);
                }
            }
        );
    }
});

app.listen(3000, function() {
    console.log("Listening...");
});
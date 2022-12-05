//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://ssala:fVueIB2Fhgqd1f6N@cluster0.dcqyldh.mongodb.net/itemsDB?retryWrites=true&w=majority");

const items = [];
const workItems = [];

const itemsToInsert = [];


const itemsSchema = mongoose.Schema({
  name: String
});

const listSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Wake up at 6"
});

const item2 = new Item({
  name: "Study 5 chapters"
});

const item3 = new Item({
  name: "Check tech news"
});

itemsToInsert.push(item1, item2, item3);



app.get("/", function(req, res) {

  Item.find(function(err, itemsRetrieved) {       
      if(itemsRetrieved.length === 0) {
        console.log("Length of item::"+itemsToInsert);
        Item.insertMany(itemsToInsert, function(err) {
          if(err) {
            console.log("Error inserting the items:"+err);
          } else {
            console.log("Items inserted successfully!");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {listTitle: "Today", newListItems: itemsRetrieved});
      }
  })
});

app.get("/:customListName", function(req, res) {  
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, listFound) {
    if(!err) {
      if(!listFound) { //If no list found then insert data
        const listToInsert = new List({name: customListName, items: itemsToInsert});
        listToInsert.save();
        res.redirect("/"+customListName)
      } else { //If list is already there in DB display the results
        res.render("list", {listTitle: customListName, newListItems: listFound.items});
      }
    }
  })
});

app.post("/", function(req, res){
  const item =  new Item({
    name: req.body.newItem
  });

  const listName = _.capitalize(req.body.list);
  console.log("listName:"+listName)
  if(listName === "Today") {
    item.save();
    res.redirect("/");  
  } else {
    List.findOne({name: listName}, function(err, listFound) {
      listFound.items.push(item);
      listFound.save();
      res.redirect("/"+listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const _id = req.body.checkBox;
  const listName = req.body.listName;
  console.log("listName:"+req.body.listName);
  
  if(listName === "Today") {
    Item.findByIdAndRemove(_id, function(err) {
      if(!err) {
        console.log("Item removed successfully!");
        res.redirect("/");
      }
    });
  } else {
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: _id}}}, function(err, updatedList) {
        if(!err) {
          res.redirect("/"+listName);
        }
      });        
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

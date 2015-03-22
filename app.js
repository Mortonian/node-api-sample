var express = require('express');
var orm = require('orm');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var dbString = "postgres://countries:password@localhost/countries";

var syncModels = function(db) {
	var Person = db.define("person", {
	        id        : {type: 'serial', key: true},
	        name      : String,
	        surname   : String,
	        age       : Number,
	        male      : Boolean,
	        continent : [ "Europe", "America", "Asia", "Africa", "Australia", "Antartica" ], // ENUM type
	        photo     : Buffer, // BLOB/BINARY
	        data      : Object // JSON encoded
	    }, {
	    	//collection: "person",
	        methods: {
	            fullName: function () {
	                return this.name + ' ' + this.surname;
	            }
	        },
	        validations: {
	            age: orm.validators.rangeNumber(18, undefined, "under-age")
	        }
	    });

	    Person.sync();	

	    return Person;
}

app.use(orm.express(dbString, {
    define: function (db, models, next) {
		models.person = syncModels(db);
        next();
    }
}));
app.listen(8080);

app.post("/dropdb", function (req, res) {

	orm.connect(dbString, function (err, db) {
  		if (err) { res.send(err); }

	    db.drop(function (err) {
	    	res.send("Dropped DB: "+err);
	    });

	    db.sync();
	});

});

app.post("/syncdb", function (req, res) {

	orm.connect(dbString, function (err, db) {
  		if (err) res.send(err);

	    syncModels(db);
	});

});

app.get("/", function (req, res) {
    // req.models is a reference to models used above in define()
    req.models.person.find({}, function (err, people) {
        // SQL: "SELECT * FROM person WHERE surname = 'Doe'"

        if (people) {
	        console.log("People found: %d", people.length);
	        console.log("First person: %s, age %d", people[0].fullName(), people[0].age);

		res.send(people);
		} else {
			console.log ("no people");

		res.send({});
		}


    });

});


app.get("/:id", function (req, res) {
	console.log("Get for id "+req.params.id);
	req.models.person.get(req.params.id, function (err, person) {

		 if (person) {
	        console.log("Person found: %d", person.id);
	        console.log("First person: %s, age %d", person.fullName(), person.age);

		res.send(person);
		} else {
			console.log ("no person");

		res.send({});
		}

	});
});


app.put("/:id", function (req, res) {
	console.log("Get for id "+req.params.id);
	req.models.person.get(req.params.id, function (err, person) {

		 if (person) {

		 	//person.name = req.body.name,
	        //person.surname   = req.body.surname,
	        //person.age       = req.body.age,
	        //person.male      = req.body.male,
	        //person.continent = req.body.continent,
	        //person.photo     = req.body.photo,
	        //person.data     = req.body.data,


			for (k in req.models.person.properties) if (k != "id") person[k] = req.body[k]
			
			person.save(function (err) {
				if (err) {
			       		 console.log("not saved! "+err);
						res.send({});
					} else {

					res.send(person);
					}
			    });

		} else {
			console.log ("no person");

		res.send({});
		}

	});
});


app.post("/", function (req, res) {
   console.log("Got POST "+req.body);
   console.log("Got POST "+req.body['name']);

	for(var k in req.body) console.log(k);
		 //console.log(req.is('json'))
		 //console.log(require)

	req.models.person.create(req.body, function(err, people){
		if (err) {
			console.log(err);
			res.send(err);			
		} else {
			res.send(people);
		}

	});
});
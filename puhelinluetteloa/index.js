const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const app = express();
const Person = require("./models/persons");
const persons = require("./models/persons");
require("dotenv").config();
app.use(express.static("dist"));
app.use(express.json());
app.use(morgan("tiny"));
app.use(cors());

app.get("/info", (request, response) => {
  Person.find({}).then((persons) => {
    response.send(`
    <html>
      <body>
        <p>The phonebook has info for ${persons.length} people.</p>
        <p>${Date()}</p>
      </body>
    </html>
  `);
  });
});

app.get("/api/persons", (request, response) => {
  Person.find({})
    .then((persons) => {
      response.json(persons);
    })
    .catch((error) => next(error));
});

app.get("/api/persons/:id", (request, response, next) => {
  Person.findById(request.params.id)
    .then((person) => {
      if (person) {
        response.json(person);
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => next(error));
});

app.delete("/api/persons/:id", (request, response) => {
  const id = request.params.id;
  Person.findByIdAndDelete(id)
    .then((person) => {
      response.status(204).end();
    })
    .catch((error) => next(error));
});

app.post("/api/persons", (request, response, next) => {
  const body = request.body;
  console.log(body);
  if (
    !body.name ||
    !body.number ||
    body.name.length === 0 ||
    body.number.length === 0
  ) {
    const error = { name: "content missing" };
    next(error);
    return;
  }
  if (body.name.length < 3) {
    const error = { name: "short name" };
    next(error);
    return;
  }

  const person = new Person({
    name: body.name,
    number: body.number,
  });
  person
    .save()
    .then((savedPerson) => {
      response.json(savedPerson);
    })
    .catch((error) => next(error));
});

app.put("/api/persons/:id", (request, response, next) => {
  const body = request.body;
  const payload = { number: body.number };
  console.log(payload);
  Person.findByIdAndUpdate(request.params.id, payload, { new: true })
    .then((updatedPerson) => {
      console.log(updatedPerson);
      response.json(updatedPerson);
    })
    .catch((error) => next(error));
});

const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  }
  if (error.name === "content missing") {
    return response.status(400).send({ error: "name and number required" });
  }
  if (error.name === "short name") {
    return response.status(400).send({ error: "The name is under 3 characters" });
  }
  if (error.name === "ValidationError") {
    return response.status(400).send({error: error.message})
  }
  next(error);
};
app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

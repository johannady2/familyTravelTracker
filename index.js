import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
 database: "worldFamilyTracker",
  password: "ChibaKing82",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

/*let users = [
  { id: 1, name: "Angela", color: "teal" },
  { id: 2, name: "Jack", color: "powderblue" },
];*/






const getAllUsers = async () =>
{
  const result = await db.query("SELECT * FROM users");

  let allUsers = [];
  result.rows.forEach((user) => {
    allUsers.push(user);
  });

  return allUsers;
};

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries");
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}
app.get("/", async (req, res) => {


  let users = await getAllUsers();
  const countries = await checkVisisted();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: "teal",
  });
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)",
        [countryCode]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {

currentUserId = req.body.user;
   let usersData = await db.query("SELECT users.id , users.name, users.color, visited_countries.country_code FROM users JOIN visited_countries ON users.id = user_id WHERE user_id = $1", [currentUserId]);

  let allUsersData = [];
  usersData.rows.forEach((user) => {
    allUsersData.push(user);
  });

  console.log(allUsersData);

  res.render("index.ejs", {
    countries: allUsersData.map((user) => user.country_code),
    total: allUsersData.length,
    users: allUsersData,
    color: allUsersData[0]?.color || "teal",
  });
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

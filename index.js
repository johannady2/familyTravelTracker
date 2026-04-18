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
let currentUserColor = "teal";
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

async function getUsersData() {
  const result = await db.query(
    `SELECT users.id,
            users.color,
            visited_countries.country_code
     FROM users
     LEFT JOIN visited_countries
       ON users.id = visited_countries.user_id
     WHERE users.id = $1`,
    [currentUserId]
  );

  // Always returns at least one row because of LEFT JOIN
  const row0 = result.rows[0];

  const theCurrentUserID = row0?.id ?? currentUserId;
  const theColor = row0?.color ?? "teal";

  const countries = result.rows
    .map(r => r.country_code)
    .filter(code => code !== null);

  return { theCurrentUserID, theColor, countries };
}



app.get("/", async (req, res) => {


  let users = await getAllUsers();
  const{theCurrentUserID,theColor, countries} = await getUsersData();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: theColor,
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
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
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
if(req.body.add === "new"){
  res.render("new.ejs");
}
else
{
  currentUserId = req.body.user;

currentUserId = req.body.user;

   //let usersData = await db.query("SELECT users.id , users.name, users.color, visited_countries.country_code FROM users JOIN visited_countries ON users.id = user_id WHERE user_id = $1", [currentUserId]);
let usersData = await getUsersData();



currentUserColor = req.body.color;
  res.redirect("/");
}
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html

  const name = req.body.name;
  const color = req.body.color;

  const result  = await db.query("INSERT INTO users (name, color) VALUES ($1, $2) RETURNING id", [name, color]);

  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

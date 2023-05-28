const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const db = knex({
    client: 'pg',
    connection: {
      connectionString: 'postgres://mydb_z8yy_user:aGSUKasYb5O0PCpy5fFXj7UjSYKb3xzl@dpg-chh7s2u7avjd1v2p2mi0-a.oregon-postgres.render.com/mydb_z8yy',
      ssl: { rejectUnauthorized: false},
      host : 'dpg-chh7s2u7avjd1v2p2mi0-a.oregon-postgres.render.com',
      port : 5432,
      user : 'mydb_z8yy_user',
      password : 'aGSUKasYb5O0PCpy5fFXj7UjSYKb3xzl',
      database : 'mydb_z8yy'
    }
  });

db.select('*').from('users').then(data => {

})

const app = express();
app.use(bodyParser.json());
app.use(cors({
    origin: "*"
}));

app.get('/', (req, res)=> {
    res.send('success'); 
})


app.post('/signin', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json('incorrect form submission');
    }
    db.select('email', 'hash').from('login')
    .where ('email', '=', req.body.email)
    .then(data => {
        const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
        if (isValid) {
            return db.select('*').from('users')
                .where('email', '=', req.body.email)
                .then(user => {
                    res.json(user[0])
                })
                .catch(err => res.status(400).json('unable to get user'))
        } else {
        res.status(400).json('wrong credentials');
        }
    })
    .catch(err => res.status(400).json('wrong credentials'))
})

app.post("/register", (req, res) => {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
        return res.status(400).json("incorrect form submission");
    }
    const hash = bcrypt.hashSync(password);
    db.transaction((trx) => {
        trx.insert({
            hash: hash,
            email: email,
        })
            .into("login")
            .returning("email")
            .then((loginEmail) =>
                trx("users")
                    .returning("*")
                    .insert({
                        email: loginEmail[0].email,
                        name: name,
                        joined: new Date(),
                    })
                    .then((user) => {
                        console.log("User registered", user[0]);
                        res.json(user[0]);
                    })
            )
            .then(trx.commit)
            .catch(trx.rollback);
    }).catch((err) => {
        console.log(err);
        return res.status(400).json("unable to register");
    });
});

app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    db.select('*').from('users').where({
        id: id
    })
    .then(user => {
        if (user.length) {
        res.json(user[0])
        } else {
            res.status(400).json('Not found')
        }
    })
    .catch(err => res.status(400).json('error getting user'))
})

app.put('/image', (req, res) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
     res.json(entries[0].entries);
    })
    .catch(err => res.status(400).json('unable to get entries'))
})

app.listen(10000, () => {
    console.log('app is running on port ');
})


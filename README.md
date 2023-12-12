# Friend List App

Simple API using express, express-session and jsonwebtoken to test authorization

## Routes

* `/` : shows the welcome message
* `/register` : add an user to access the API
* `/login` : authorizes user to access the API
* `/friends` : manages friends object

## Requests

* `GET /` : welcome message to API
* `POST /register` : registers user with JSON provided in body
* `POST /login` : authorizes user to access the API with JSON provided in body
* `GET /friends/:email` : shows info about friend that has the email provided
* `POST /friends` : adds a friend using email as ID with JSON provided on body
* `PUT /friends/:email` : updates the information of friend that matched ID
* `DELETE /friends/:email` : delete friend that matches ID

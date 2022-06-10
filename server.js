// incluye módulo express
var express = require("express");

// crear instancia de express
var app = express();

// usa middleware express - formidable
var formidable = require("express-formidable");
app.use(formidable());

// incluir módulo mongodb
var mongodb = require("mongodb");

// obtener el cliente mongodb
var mongoClient = mongodb.MongoClient;

// obtener ObjectId, es único para cada documento
var ObjectId = mongodb.ObjectId;

// crea un servidor http a partir de una instancia express
var http = require("http").createServer(app);

// incluye el módulo bcrypt
var bcrypt = require("bcrypt");

// fs
var fileSystem = require("fs");

// incluye el módulo jsonwebtoken
var jwt = require("jsonwebtoken");

// cadena secreta aleatoria
var accessTokenSecret = "myAccessTokenSecret1234567890";

// use la carpeta pública para archivos css y js
app.use("/public", express.static(__dirname + "/public"));

// usa el motor ejs para renderizar archivos html
app.set("view engine", "ejs");

// socket
var socketIO = require("socket.io")(http);
var socketID = "";
var users = [];

var mainURL = "http://localhost:3000";

socketIO.on("connection", function (socket) {
    console.log("Usuario conectado", socket.id);
    socketID = socket.id;
});

/*******************************/
// inicia el servidor en el puerto 3000
/*******************************/
http.listen(3000, function () {
    console.log("Servidor iniciado." + mainURL);

    // conectarse con mongo atlas
    mongoClient.connect("mongodb+srv://brandon:proyectobd3@cluster0.apfbj.mongodb.net/mentoria_proyecto", function (error, client) {
        //mongodb+srv://brandon:proyectodb3@cluster0.apfbj.mongodb.net/mentoria_proyecto?retryWrites=true&w=majority
        // el nombre de la base de datos será "mentoria_proyecto"
        var database = client.db("mentoria_proyecto");
        console.log("Base de datos conectada!");

        // ruta para las solicitudes de registro
        // obtener acceso a la solicitud desde el navegador
        app.get("/signup", function (request, result) {
            // renderizar el archivo signup.ejs dentro de la carpeta "vistas"
            result.render("signup");
        });

        /*******************************/
        /* Registrarse */
        /*******************************/
        app.post("/signup", function (request, result) {
            var name = request.fields.name;
            var username = request.fields.username;
            var email = request.fields.email;
            var password = request.fields.password;
            var gender = request.fields.gender;

            database.collection("users").findOne({
                $or: [{
                    "email": email
                }, {
                    "username": username
                }]
            }, function (error, user) {
                if (user == null) {
                    bcrypt.hash(password, 10, function (error, hash) {
                        database.collection("users").insertOne({
                            "name": name,
                            "username": username,
                            "email": email,
                            "password": hash,
                            "gender": gender,
                            "profileImage": "",
                            "coverPhoto": "",
                            "dob": "",
                            "city": "",
                            "country": "",
                            "aboutMe": "",
                            "friends": [],
                            "pages": [],
                            "notifications": [],
                            "groups": [],
                            "posts": []
                        }, function (error, data) {
                            result.json({
                                "status": "success",
                                "message": "Se registró correctamente. Puede iniciar sesión ahora."
                            });
                        });
                    });
                } else {
                    result.json({
                        "status": "error",
                        "message": "El correo electrónico o el nombre de usuario ya existen.",
                    });
                }
            });
        });

        app.get("/login", function (request, result) {
            result.render("login")
        });

        /*******************************/
        /* Login */
        /*******************************/
        app.post("/login", function (request, result) {
            var email = request.fields.email;
            var password = request.fields.password;
            database.collection("users").findOne({
                "email": email
            }, function (error, user) {
                if (user == null) {
                    result.json({
                        "status": "error",
                        "message": "El email ingresado no existe"
                    });
                } else {
                    bcrypt.compare(password, user.password, function (error, isVerify) {
                        if (isVerify) {
                            var accessToken = jwt.sign({
                                email: email
                            }, accessTokenSecret);
                            database.collection("users").findOneAndUpdate({
                                "email": email
                            }, {
                                $set: {
                                    "accessToken": accessToken
                                }
                            }, function (error, data) {
                                result.json({
                                    "status": "success",
                                    "message": "Usuario ingresó correctamente",
                                    "accessToken": accessToken,
                                    "profileImage": user.profileImage
                                });
                            });
                        } else {
                            result.json({
                                "status": "error",
                                "message": "La contraseña no es correcta."
                            });
                        }
                    });
                }
            });
        });

        app.get("/updateProfile", function (request, result) {
            result.render("updateProfile")
        });

        app.post("/getUser", function (request, result) {
            var accessToken = request.fields.accessToken;
            database.collection("users").findOne({
                "accessToken": accessToken
            }, function (error, user) {
                if (user == null) {
                    result.json({
                        "status": "error",
                        "message": "El usuario ha sido desconectado. Por favor ingrsar de nuevo."
                    });
                } else {
                    result.json({
                        "status": "success",
                        "message": "Se ha recuperado el registro.",
                        "data": user
                    });
                }
            });
        });

        /*******************************/
        /* Salir */
        /*******************************/
        app.get('/logout', function (request, result) {
            result.redirect('/login');
        });
    })
    })
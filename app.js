const express  = require('express');
const app = express();

//debug , se usa para mostrar mensajes de debug
//$env:DEBUG="app:*"
const debug = require('debug')('app:inicio');
//const DBdebug = require('debug')('app:DBinicio');

//esto ya no se usa
//const logger = require('./logger');
//se puede usar un middleware de terceros como log que es - morgan
const morgan = require('morgan');
//configuracion de entornos de trabajo
const config = require('config');

//validacion
const Joi = require('@hapi/joi');
const { func } = require('@hapi/joi');

const usuarios = [
    {id:1 , nombre: 'ema'},
    {id:2 , nombre: 'rosa'},
    {id:3 , nombre: 'ana'}
]

//funcioes middleware, se ejecutan antes de las funcioes ruta(get, post, put, delete)
app.use(express.json());
//middleware para trabajar con datos pasados por url
//con esto ya no tengo que pasar un post en formato json, sino que puede ser en url
app.use(express.urlencoded({extended : true}));
//para publicar archivos estaticos(txt, imagenes, etc)
app.use(express.static('public'));

//config de entorno
// export NODE_ENV=production
console.log('aplicacion: ' + config.get('nombre'));
console.log('bd server: ' + config.get('configDB.host'));


//esto ya no se usa
//app.use(logger);
//se loguea con morgan
//en caso de estar en un entorno de desarrolo se loguea
if (app.get('env') === 'development'){
    app.use(morgan('tiny'));
    debug("morgan funcionando");
}

//en caso de una funcion de db
debug("conectado a la bd....");


app.use(function(req,res, next){
    console.log("autentication....");
    next();
})

//funciones ruta
app.get('/', (req, res) => {
    res.send('Pagina de inicio');
});

app.get('/api/usuarios', (req,res) =>{
    res.send(usuarios );
});

//mostrar un parametro por pantalla
app.get('/api/usuarios/:id', (req,res) =>{
    let usuario = usuarios.find(u => u.id === parseInt(req.params.id));
    if (!usuario) res.status(404).send("no se ha encontrado el usuario");
    res.send(usuario);
})
//mostrar varios parametros en pantalla
app.get('/api/usuarios/:mes/:year', (req,res) =>{
    res.send(req.params);
})

//post
//con validacion
/* app.post('/api/usuarios', (req, res) =>{
    if (!req.body.nombre || req.body.nombre.length<=2){
        res.status(400).send('debe ingresar un nombre valido');
    }
    const usuario = {
        id: usuarios.length + 1,
        nombre : req.body.nombre
    };
    usuarios.push(usuario);
    res.send(usuario);
}) */
//joi
app.post('/api/usuarios', (req, res) =>{
    const schema = Joi.object({
        nombre : Joi.string().min(3).required()
    });
    const {error, value} = schema.validate({ nombre: req.body.nombre });
    if (!error){
        const usuario = {
            id: usuarios.length + 1,
            nombre : value.nombre
        };
        usuarios.push(usuario);
        res.send(usuario);
    }else{
        const mensaje = error.details[0].message;
        res.status(400).send(mensaje);
    }

});

//put
app.put('/api/usuarios/:id', (req,res) => {
    //ver si existe
    //let usuario = usuarios.find(u => u.id === parseInt(req.params.id));
    let usuario = existeUsuario(req.params.id);
    if (!usuario){
        res.status(404).send("no se ha encontrado el usuario");
        return;
    } 
/* 
    const schema = Joi.object({
        nombre : Joi.string().min(3).required()
    }); */

   // const {error, value} = schema.validate({ nombre: req.body.nombre });
   const {error, value} = validarUsuario(req.body.nombre);

    if (error){
        const mensaje = error.details[0].message;
        res.status(400).send(mensaje);
        return;
    }

    usuario.nombre = value.nombre;
    res.send(usuario); 

});

//delete
app.delete('/api/usuarios/:id', (req, res) =>{
    let usuario = existeUsuario(req.params.id);
    if (!usuario){
        res.status(404).send("el usuario no existe");
        return;
    }
    const index = usuarios.indexOf(usuario);
    //funcion de borrado, el uno indica que sol ose borra ese.
    usuarios.splice(index, 1);

    res.send(`se ha borrado el usuario ${usuario.nombre}`);

})




// setear variable de entorno - puerto
// para setear un puerto en wondows es set PORT = 5000
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`escuchando en el puerto ${port}...`);
});

//funciones de validacion

function existeUsuario(id){
    return (usuarios.find(u => u.id === parseInt(id)));
}

function validarUsuario(nom){
    const schema = Joi.object({
        nombre: Joi.string().min(3).required()
    });
    return (schema.validate({nombre : nom}));
}
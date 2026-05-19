const express = require('express')
const sqlite = require('sqlite3')

const app = express()

//******* Configuraciones  */
app.set('view engine','ejs')


//****** Middleware ************/
app.use(express.static('public'))
app.use(express.urlencoded({extended:false}))


//****** Conexión a base de datos ********/
const base_datos = new sqlite.Database('datos.db',sqlite.OPEN_READWRITE, (error)=>{
    if (error){
        console.log('Error al conectarse a la base de datos')
    } else {
        console.log('Se conecto a la base de datos con exito')
    }
}) 


//******* Rutas  ***********/
// 1. Mostrar la página principal
app.get('/', (req, res)=>{
    // Usamos LEFT JOIN y COALESCE para cambiar el ID numérico por el texto de la marca
    const sql = `
        SELECT productos.id, productos.nombre, productos.precio, productos.stock,
               COALESCE(marcas.marca, productos.marca) AS marca
        FROM productos
        LEFT JOIN marcas ON productos.marca = marcas.id
    `;
    base_datos.all(sql,(error, resultado)=>{
        if (error){
            console.log('Error en la consulta a la base de datos');
        } else {
            res.render('principal.ejs', {resultado});
        }
    });
});

// 2. Buscar productos
app.post('/buscar', (req, res)=>{
    const filtro = req.body.buscar + '%';
    const sql = `
        SELECT productos.id, productos.nombre, productos.precio, productos.stock,
               COALESCE(marcas.marca, productos.marca) AS marca
        FROM productos
        LEFT JOIN marcas ON productos.marca = marcas.id
        WHERE productos.nombre LIKE ?
    `;
    base_datos.all(sql, [filtro], (error, resultado)=>{
        if (error){
            console.log('Error en la consulta a la base de datos');
        } else {
            res.render('principal.ejs', {resultado});
        }
    });
});

// 3. Pantalla de editar producto
app.get('/editar', (req, res) => {
    const id = req.query.id;
    // Aplicamos el JOIN también aquí para que el menú autoseleccione la marca correcta
    const sql = `
        SELECT productos.id, productos.nombre, productos.precio, productos.stock,
               COALESCE(marcas.marca, productos.marca) AS marca
        FROM productos
        LEFT JOIN marcas ON productos.marca = marcas.id
        WHERE productos.id = ?
    `;
    base_datos.get(sql, [id], (error, fila) => {
        if (error) {
            console.log('Error al consultar la base de datos');
        } else {
            res.render('editar.ejs', { fila });
        }
    });
});

app.post('/nuevo', (req, res) => {
    const {nombre, marca, precio, stock} = req.body
    const sql = 'insert into productos (nombre, marca, precio, stock) values (?,?,?,?)'
    base_datos.run(sql,[nombre, marca,precio,stock], (error) => {
        if (error){
            console.log('Error al insertar nuevo producto')
        } else {
            res.redirect('/')
        }
    })
})

app.get('/eliminar', (req, res) => {
    const id = req.query.id
    const sql = 'delete from productos where id=?'
    base_datos.run(sql, [id], (error)=> {
        if (error){
            console.log('Error al eliminar el producto')
        } else {
            res.redirect('/')
        }
    })
})

// RUTA CORREGIDA: Usa base_datos.get para que coincida con tus variables
app.get('/editar', (req, res) => {
    const id = req.query.id
    const sql = 'select * from productos where id = ?'
    base_datos.get(sql, [id], (error, fila) => {
        if (error) {
            console.log('Error al consultar la base de datos')
        } else {
            res.render('editar.ejs', { fila })
        }
    })
})

app.post('/editar', (req, res) => {
    const {id, nombre, marca, precio, stock} = req.body
    const sql = "update productos set nombre=?, marca=?, precio=?, stock=? where id=?"
    base_datos.run(sql, [nombre, marca, precio, stock, id], (error) => {
        if (error){
            console.log('Error al actualizar el producto')
        } else {
            res.redirect('/')
        }
    })
})

app.get('/marcas', (req, res)=> {
    const sql = 'select * from marcas order by marca'
    base_datos.all(sql, (error, filas)=>{
        if (error){
            console.log('Error al consultar la BD')
        } else {
            res.render('marcas.ejs',{filas})
        }
    })
})

app.post('/nueva_marca', (req, res) => {
    const marca = req.body.marca
    const sql = 'insert into marcas (marca) values (?)'
    base_datos.run(sql,[marca], (error) => {
        if (error){
            console.log('Error al insertar nueva marca')
        } else {
            res.redirect('/marcas')
        }
    })
})

app.get('/editar_marca', (req, res) => {
    const id = req.query.id;
    const sql = "SELECT * FROM marcas WHERE id = ?";
    
    base_datos.get(sql, [id], (error, fila) => {
        if (error) {
            console.log('Error al buscar la marca');
            res.send('Error');
        } else {
            // Le pasa la marca encontrada a la plantilla
            res.render('editar_marca.ejs', { marca: fila });
        }
    });
});

app.post('/editar_marca', (req, res) => {
    const { id, marca } = req.body;
    const sql = "UPDATE marcas SET marca = ? WHERE id = ?";
    
    base_datos.run(sql, [marca, id], (error) => {
        if (error) {
            console.log('Error al modificar la marca');
            res.send('Error al guardar');
        } else {
            // Te regresa directo a la lista de marcas ya actualizada
            res.redirect('/marcas');
        }
    });
});

app.get('/eliminar_marca', (req, res) => {
    const id = req.query.id
    const sql = 'delete from marcas where id=?'
    base_datos.run(sql, [id], (error) => {
        if (error) {
            console.log('Error al eliminar la marca')
        } else {
            res.redirect('/marcas')
        }
    })
})


//******** Ejecución del servidor */
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Servidor escuchando por el puerto ${PORT}`)
})
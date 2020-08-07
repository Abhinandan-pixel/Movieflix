var express     = require("express");
var app         = express();
var port        = 8080;
var bodyParser  = require("body-parser");
var mysql       = require("mysql");
var http        = require("http");
var request     = require("request");
const { off } = require("process");

var urlencodedParser = app.use(bodyParser.urlencoded({ extended: false}))
app.set("view engine","ejs");
app.use(express.static(__dirname + "/public"))
//Connections
var pool = mysql.createPool({
    host     : '127.0.0.1',
    user     : 'root',
    password : 'Sarahhyland24',
    database : 'mflix',
    port: 3306,
    insecureAuth: true
  });

app.get('/api/movies', getAllMovies);
var server  = http.createServer(app);
app.get("/",(req, res)=>{
    res.render("pages/index");
})

app.get('/show',(req, res)=>{
    var id = Number(req.query.id);
    pool.getConnection(function(err,connection){
        connection.query('SELECT * FROM movies as m,movies_has_stars as ms,stars as s WHERE m.id=ms.movies_id and ms.stars_id=s.id and m.id=?',[id],function(error,movie,fields){
            connection.query('SELECT * FROM movies as m,movies_has_genres as mg,genres as g WHERE m.id=mg.movies_id and mg.genres_id=g.id and m.id=?',[id],function(error,genres,fields){
                connection.query('SELECT * FROM movies as m,movies_has_directors as md,directors as d WHERE m.id=md.movies_id and md.directors_id=d.id and m.id=?',[id],function(error,directors,fields){
                    connection.release();
                    if(error){
                        console.log("error")
                    }else{
                        console.log(movie);
                        res.render("pages/show",{movie:movie,genres:genres,directors:directors});
                    }
                
                })
               
            })
           
        })
    })
    
})
app.get('/show/actors',(req,res)=>{
    var id = Number(req.query.id);
    console.log(id);
    pool.getConnection(function(err,connection){
        connection.query('SELECT * from stars WHERE id=?',[id],function(error,actors,fields){
            connection.release();
            if(error){
                console.log(error);
                res.redirect("back");
            }else{
                console.log(actors);
                res.render("pages/actors",{actors:actors});
            }

        })
    })
})
app.get('/show/directors',(req,res)=>{
    var id = Number(req.query.id);
    console.log(id);
    pool.getConnection(function(err,connection){
        connection.query('SELECT * from directors WHERE id=?',[id],function(error,directors,fields){
            connection.release();
            if(error){
                console.log(error);
                res.redirect("back");
            }else{
                console.log(directors);
                res.render("pages/directors",{directors:directors});
            }

        })
    })
})
app.get("/all",(req,res)=>{
    var pageNo = req.query.page;
    request(`http://localhost:8080/api/movies?page=${pageNo}`,(err,resp,body)=>{
        if(err && resp.statusCode != 200){
            
            console.log("error");
         }
         var parsedData = JSON.parse(body);
         res.render("pages/all",{movies:parsedData.movies});
    })
})


server.listen(port,function(){
    console.log("Server Started");
})

function getAllMovies(req, res){
    var limit = 9;
    var page  = Number(req.query.page);
    console.log(typeof(page));
    var offset= (page - 1) * limit;
 //   const movieQuery = "select * from movies limit "+limit+" OFFSET "+offset;
    pool.getConnection(function(err, connection){
        connection.query('SELECT * FROM movies limit ? OFFSET ?',[limit,offset] ,function(error,results,fields){
            connection.release();
            if(error) throw error;
            var jsonResult = {
                'movies_page_count':results.length,
                'page_number':page,
                'movies':results
              }
              // create response
              var myJsonString = JSON.parse(JSON.stringify(jsonResult));
              res.statusMessage = "Products for page "+page;
              res.statusCode = 200;
              res.json(myJsonString);
              res.end();
        })
    })
}
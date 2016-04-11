/**
 * Created by vir-mir on 11.04.16.
 */


module.exports = function(app) {

    //Route not found -- Set 404
	app.get('/', function (req, res) {
        res.render('index.ejs');
    });

    //Route not found -- Set 404
	app.get('*', function (req, res) {
        res.statusCode = 404;
    });
};

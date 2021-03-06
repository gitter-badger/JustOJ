/**
 * @author <a href="madinar.cse@gmail.com">Ahmed Dinar</a>
 *
 * @type {exports|module.exports}
 */

var mysql      = require('mysql');
var dbPool     = require('./dbConnectionPool.js');
var where      = require('./where.js');
var _          = require('lodash');


/**
 *
 * define table to search
 *
 * @param table
 * @returns {exports}
 */
exports.in = function(table){
    this.table = table;
    return this;
};


/**
 *
 * @param callback
 * @returns {*}
 */
exports.countAll = function(callback) {

    var sql = 'SELECT COUNT(*) FROM ?? ';
    var inserts = [this.table];
    sql = mysql.format(sql,inserts);

    return query(sql,callback);
};



/**
 *
 * @param options
 * @param callback
 * @returns {*}
 */
exports.findAll = function(options,callback) {

    var sql = 'SELECT ';

    var inserts = [];
    var whq = null,limit = null,offset = null;

    _.forOwn(options, function(value, key) {

        if( key === 'attributes' ){
            inserts.push(value);
        }
        else if( key === 'where' ){
            whq = where.where(value);
        }
        else if( key === 'limit' ){
            limit =  mysql.escape(value);
        }
        else if( key === 'offset' ){
            offset =  mysql.escape(value);
        }

    });

    if( inserts.length>0 ){
        sql += '??';
    }else{
        sql += '*';
    }

    inserts.push(this.table);

    sql += ' FROM ?? ';


    sql = mysql.format(sql,inserts);

    if(whq){
        sql += ' WHERE ' + whq;
    }

    if( limit ){
        sql += ' LIMIT ' + limit;
    }

    if( offset ){
        sql += ' OFFSET ' + offset;
    }

    return query(sql,callback);

};


/**
 *
 * @param options
 * @param callback
 * @returns {*}
 */
exports.insert = function(options,callback) {

    var sql = "INSERT INTO ?? SET ?";
    var inserts = [this.table,options];
    sql = mysql.format(sql, inserts);

    return query(sql,callback);

};

/**
 *
 * @param options
 * @param callback
 * @returns {*}
 */
exports.insertUnique = function(options,callback) {

    var sql = "INSERT INTO ?? (";
    var sel1 = "SELECT ", sel2 = "FROM(SELECT ",wh = '';
    var inserts = [this.table];

    var i = 0;
    _.forOwn(options, function(value, key) {

        console.log( key + ' ' + value );

        if( key === 'where' ){
            wh = ' WHERE ' + where.where(value);
        }else{
            inserts.push(key);
            if( i>0 ){
                sql+=',';
                sel1 += ',';
                sel2 += ',';
            }

            sel1 += 'col' + i;
            sel2 += mysql.escape(value)+ ' AS col' + i;

            sql+='??';
            i++;
        }
    });
    sql += ') ';
    sql += sel1 + ' ' + sel2 + ') t';
    sql += " WHERE NOT EXISTS (SELECT * FROM ??";


    sql += wh + ')';

    inserts.push(this.table);

    sql = mysql.format(sql, inserts);

    return query(sql,callback);
};


/**
 *
 * @param options
 * @param callback
 * @returns {*}
 */
exports.delete = function(options,callback) {

    var sql = "DELETE FROM ??";
    var inserts = [this.table];
    sql = mysql.format(sql, inserts);

    _.forOwn(options, function(value, key) {

        if( key === 'where' ){
             sql += ' WHERE ' + where.where(value);
        }

    });

    return query(sql,callback);

};


/**
 *
 * @param options
 * @param callback
 * @returns {*}
 */
exports.update = function(options,callback) {

    var sql = "UPDATE ?? SET ?";
    var inserts = [this.table];
    var whq = null;

    _.forOwn(options, function(value, key) {

        if( key === 'attributes' ){
            inserts.push(value);
        }
        else if( key === 'where' ){
            whq = where.where(value);
        }

    });

    sql = mysql.format(sql,inserts);

    if(whq){
        sql += ' WHERE ' + whq;
    }

    return query(sql,callback);
};



/**
 *
 * @param sql
 * @param callback
 */
function query(sql,callback){

    console.log(sql);

    dbPool.getConnection(function(err, connection) {

        if(err){
            //console.log(err);
            return callback('error establishing connection with database!',null);
        }

        connection.query(sql, function(err, rows) {

            connection.release();

            if(err){
               // console.log(err);
                return callback('database error!',null);
            }

            return callback(null,rows);

        });
    });
}


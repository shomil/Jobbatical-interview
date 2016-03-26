var express = require('express');
var app = express();
var mysql = require('mysql');

var pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'test'
});

var queryres;
var output = [];
var user = {};

app.get('/topActiveUsers', function(req, res){
	var startIndex=0;//Store start index of each page
	var endIndex=0;//Store end index of each page
	var pageNum=0;//Store pageNum to show
	var perPage=3;//increase this value to increase data in perpage
	var total=0;//total number of user in system
	
	pageNum = req.query.page;//query parameter having page number
	
	if(pageNum <= 0)
		pageNum =1;
	startIndex = perPage*(pageNum - 1) +1;//Start index Calculation
	endIndex =  perPage*pageNum;//End Index Calculation
	total = pageNum*perPage;//Total number of user in system
	
	/*
	*@arg: row - contains user info
	*@arg: conn - connection of DB to perform DB operations
	*@cb: callback - return data after query executes and data populated
	* This Function gets the listings related to user.
	* It populated the output array using listings and row.
	* This is called for each user.
	*/
	function getListings(row,conn,cb){
		conn.query("select tl.name from listings tl inner join"
		+" (select listing_id,user_id,created_at from applications) ta on ta.listing_id = tl.id"
		+" where ta.user_id = ? order by ta.created_at desc limit 3",row["user_id"],function(err,list) {
			if(err){
				throw err;
			}
			else{
				output.push({
					id: row["user_id"], 
					createdAt: row["created_at"], 
					name: row["name"], 
					count: row["cnt"], 
					listings: list
				});
				cb(output);
			}//else ends
		});//conn.query ends
	}//function getListings ends

	/*
	*@cb: callback - return data after all query executes and data populated
	* This function queries top user data as per activity for last 1 week.
	* It calls getListings() for each user and once data is returned from it,
	* it will call the invoking function with data.
	*/
	function getTopUsers(callback){
		pool.getConnection(function(err, conn) {
			if(err){
				console.log("DB Connection may have occured : " +err);
			}
			else{
				conn.query("Select * from users tu inner join ("+"SELECT id, created_at,user_id, count(*) cnt FROM applications "
					+"where id in (select id from applications where created_at > current_timestamp() - interval 1 WEEK) "
					+"group by user_id) "
				+"ta on tu.id = ta.user_id order by ta.cnt desc", function(err, rows){
					if(err){
						console.log("error in query : "+err);
						throw err;
					}
					else{
						
						if(total > rows.length) {
							endIndex = rows.length;
							startIndex = perPage*(Math.ceil(endIndex/perPage) -1)+1;
						}//Calculates end index and start index if it lies beyound the range
						
						if(rows.length != 0){
							queryres = endIndex-startIndex+1;
							for (var i=startIndex-1; i<endIndex; i++){
								getListings(rows[i],conn,function(data) {
									queryres--;
									if(0 === queryres)
										callback(data);
								});//callback ends
							}//for loop ends
						}//if cond ends
					}//
					conn.release();
				});
			}
		});
	}

	getTopUsers(function(op){
		output = [];
		res.contentType('application/json');
		res.send(JSON.stringify(op));
	})
});

app.get('/users', function(req, res) {
    var userId = 0;//Stores query param
    userId = req.query.id;

    /*
    *@arg:conn - Db connection to perform DB operations
    *@arg: callback -  to send updated data after query gets executed and data is populated
    * This function gets the connected companies, populates the data to companyArray and send
    * it to invoking function using callback
    */
    function getCompanies(conn,callback){
    	var companyArray = [];
    	conn.query("select tc.id companies_id,tc.created_at companies_created_at,tc.name companies_name,"
    		+" tt.contact_user team_contactUser"
    		+" from companies tc,teams tt"
    		+" where tt.user_id =? and"
    		+" tt.company_id = tc.id limit 5",userId,function(err,rows){
    			if(err){
	    			console.log("err in query "+err);
	    			throw err;
	    		}
    			else{
    				if(rows.length != 0){
    					for(var i=0;i<rows.length;i++){
    						companyArray.push({
    							id: rows[i].companies_id,
								createdAt: rows[i].companies_created_at,
								name: rows[i].companies_name,
								isContact: (rows[i].team_contactUser) ? true:false
    						});
    					}//for loop ends
    				}//If cond loop
    				callback(companyArray);
    			}//else cond loop
    		});//conn.query
    }//function

    /*
    *@arg:conn - Db connection to perform DB operations
    *@arg: callback -  to send updated data after query gets executed and data is populated
    * This function gets the connected listings, populates the data to createdLisitngsArray and send
    * it to invoking function using callback
    */
    function getcreatedListings(conn, callback){
    	var createdLisitngsArray = [];
    	conn.query("SELECT * FROM listings where created_by =? limit 5", [userId], function(err, rows2) {
    		if(err){
    			console.log("err in query "+err);
    			throw err;
    		}
    		else{
    			if(rows2.length != 0){
    				for(var i=0;i<rows2.length;i++){
						createdLisitngsArray.push({
	    					id: rows2[i].id,
							createdAt: rows2[i].created_at,
							name: rows2[i].name,
							description: rows2[i].description
						});
    				}//for loop ends
    			}//if cond ends
    			callback(createdLisitngsArray);
    		}//else cond ends
    	});//conn.query ends
    }//function ends

    /*
    *@arg:conn - Db connection to perform DB operations
    *@arg: callback -  to send updated data after query gets executed and data is populated
    * This function gets the Applications , populates the data to appListing and send
    * it to invoking function using callback
    */
    function getApplicationListing(conn, callback){
    	var appListing=[];
    	conn.query("SELECT ta.id app_id,ta.created_at,ta.cover_letter,tl.id list_id, tl.name,tl.description"
    		+" FROM applications ta ,"
    		+" listings tl"
    		+" where ta.user_id =?"
    		+" and ta.listing_id=tl.id limit 5",userId,function(err,rows){
    			if(err){
    				console.log("err in query "+err);
    				throw err;
    			}
    			else{
    				if(rows.length !=0){
    					for(var i=0;i<rows.length;i++){
    						appListing.push({
    							id: rows[i].app_id,
								createdAt: rows[i].created_at,
								listing: {
									id: rows[i].list_id,
									name: rows[i].name,
									description: rows[i].description
								},
								coverLetter: rows[i].cover_letter
    						});
    					}//for loop ends
    				}//if cond ends
    				callback(appListing);
    			}//else cond ends
    		});//conn.query ends
    }//function ends

    /*
    *@arg: callback -  to send updated data after query gets executed and data is populated
    * This function gets the userinfo , populates the data to user object,call functions to get
    * connected companies, created listings and applications and send
    * it to invoking function using callback
    */
    function getUserInfo(callback) {
        pool.getConnection(function(err, conn) {
            if (err) {
                console.log("DB Connection may have occured : " + err);
            }
            else {
            	if(userId == 0){
            		user={};
            		user.id="user id doesnot exist";
            		callback(user);
            	}//check user id
            	else{
	                conn.query("SELECT id,name,created_at FROM users where id =?", [userId], function(err, rows1) {
	                    if (err) {
	                        console.log("error in query : " + err);
	                        throw err;
	                    }
	                    else {
	                        if (rows1.length != 0) {
	                            user.id= rows1[0].id;
	                            user.name= rows1[0].name;
	                            user.createdAt= rows1[0].created_at;
			                    getCompanies(conn,function(data1){
			                    	user.companies = data1;//connected companies added to key
			                    	getcreatedListings(conn,function(data2){
				                    	user.createdListings= data2;//listing added to key
				                    	getApplicationListing(conn,function(data3){
				                    		user.applications = data3;//Applications added to key
				                    		callback(user);
				                    	});//data3 for applications
			                    	});//data2 for listings
			                    });//data1 for connected companies
			                }//if cond ends
			                else{
			                	user={};
			            		user.id="user id doesnot exist";
			            		callback(user);
			                }
			                conn.release();//release conn at last
			            }
	                });//conn.query ends
				}//else cond ends
        	}//else cond ends
        });//pool.getConnection ends
	}//function ends

    getUserInfo(function(data) {
        res.contentType('application/json');
        res.send(JSON.stringify(data));
    });

}); //end of app.get
var server = app.listen(3000, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log("I am listening at http://%s:%s Hit me on Postman", host, port)
});

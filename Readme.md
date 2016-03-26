1. cd to cloned folder
2. run sudo npm install
3. Create a DB name test or replace database name in pool.database.
3. run mysqld
4. run node shserver.js
5. Open Postman
6. Select Get and give end point as mentioned in readme.md

1. Endpoint 1 = http://localhost:3000/topActiveUsers?page=pagenum
2. pagination -  it will show top 3 users perpage.
3. if required to increase perpage value , increase the value of perPage.
4. if pagenum*perpage > total users in system, then it will show the last page.
5. if pagenum = 0, it will show first pgae.

1. Endpoint 2 =  http://localhost:3000/users?id=id
2. if id doesnot exist it will show user doesnot exist else it will show result.

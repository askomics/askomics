#pull the allegrograph image
sudo docker pull franzinc/agraph

#run
sudo docker run -d -p 10000-10035:10000-10035 --name agraph franzinc/agraph

#info:
http://localhost:10035
user:test
passwd:xyzzy

#action:
go to http://localhost:10035
create new repository -> 'database'

#Parameters

askomics.endpoint = http://localhost:10035/repositories/database/sparql
askomics.endpoint.username = test
askomics.endpoint.passwd = xyzzy


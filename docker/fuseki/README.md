# Docker files for fuseki

Build an image of Fuseki 2.3.1 for Askomics Web interface.

This image run a simple service with the option --loc=/database (One database available)

For persistance, use option -v of docker to map with a local directory.
Note that Fuseki is launched with the following options :
 --strict, --verbose, --update

# Running Askomics/Fuseki

sudo docker run --name=fuseki -p 3030:3030 -v /my/local/path/database:/database --rm -i -t askomics/fuseki-2.3.1


#Parameters

askomics.endpoint = http://localhost:3030/database/query
askomics.updatepoint = http://localhost:3030/database/update
askomics.max_content_size_to_update_database=10000







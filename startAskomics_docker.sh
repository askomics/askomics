#! /bin/bash


function usage(){
    printf 'Usage: ./startAskomics_docker.sh -e <endpoint> -a <askomics url> -t <triplesore> -d <deployment mode>\n'
    printf "\t-e      triplesore endpoint (default: http://localhost:8890/sparql)\n"
    printf "\t-a      askomics url (default: http://localhost:6543)\n"
    printf "\t-t      askomics triplesore (default: virtuoso)\n"
    printf "\t-d      deployment mode, development or production (default: production)\n"
    printf "\n\t-h      display this help\n"
}

# default values
endpoint='http://localhost:8890/sparql'
url='http://localhost:6543'
triplestore='virtuoso'
depmode='production'


while getopts "he:a:t:d:" option; do
    case $option in
        h)
            usage
            exit
        ;;

        e)
            endpoint=$(echo "$OPTARG" | xargs)
        ;;

        a)
            url=$(echo "$OPTARG" | xargs)
        ;;

        t)
            triplestore=$(echo "$OPTARG" | xargs)
        ;;

        d)
            depmode=$(echo "$OPTARG" | xargs)
        ;;
    esac
done

printf "endpoint: $endpoint\n"
printf "url: $url\n"
printf "triplestore: $triplestore\n"
printf "depmode: $depmode\n"

# Set the virtuoso endpoint
sed -e "s!@ENDPOINT@!$endpoint!g" configs/"$depmode".template.ini > configs/"$depmode".virtuoso.ini

# Set the load URL of askomics
sed -ie "s!@LOAD_URL@!$url!g" configs/"$depmode".virtuoso.ini

# Create a user
#TODO

# Lauch the ./startAskomics script
./startAskomics.sh -t $triplestore -d $depmode -r
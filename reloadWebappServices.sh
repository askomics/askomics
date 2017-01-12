#!/bin/bash

echo "Will reload AskOmics (add '--cp' parameter to only copy new files without restarting the webapp)"

if [ -z `which docker` ];then
    echo >&2 " == docker is not installed !! == "
    exit 1
fi

NORESTART=$1

dockerimg=`sudo docker ps -a | grep "askomics/web" | awk '{print $1}'`

if [ -n "$dockerimg" ];then
    echo "===== Reloading Askomics  ======== $dockerimg"

    docker cp . $dockerimg:/usr/local/AskomicsWeb/

    if [ "--cp" != "$NORESTART" ];then
        docker restart $dockerimg
    fi
else
    echo >&2 " == could not find docker container !! == "
    exit 1
fi

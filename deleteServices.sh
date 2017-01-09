#!/bin/bash

dockerimg=`docker ps -a | grep "askomics/fuseki" | awk '{print $1}'`
if [ -n "$dockerimg" ];then
    echo "===== Stopping fuseki  ======== $dockerimg"
    docker rm -f $dockerimg
fi

dockerimg=`docker ps -a | grep "franzinc/agraph" | awk '{print $1}'`

if [ -n "$dockerimg" ];then
    echo "===== Stopping agraph  ======== $dockerimg"
    docker rm -f $dockerimg
fi

dockerimg=`docker ps -a | grep "askomics/virtuoso" | awk '{print $1}'`

if [ -n "$dockerimg" ];then
    echo "===== Stopping virtuoso  ======== $dockerimg"
    docker rm -f $dockerimg
fi

dockerimg=`docker ps -a | grep "askomics/web" | awk '{print $1}'`

if [ -n "$dockerimg" ];then
    echo "===== Stopping Askomics  ======== $dockerimg"
    docker rm -f $dockerimg
fi

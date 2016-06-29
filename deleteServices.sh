#!/bin/bash

dockerimg=`sudo docker ps -a | grep "askomics/fuseki" | awk '{print $1}'`
if [ -n "$dockerimg" ];then
    echo "===== Stopping fuseki  ======== $dockerimg"
    sudo docker rm -f $dockerimg
fi

dockerimg=`sudo docker ps -a | grep "franzinc/agraph" | awk '{print $1}'`

if [ -n "$dockerimg" ];then
    echo "===== Stopping agraph  ======== $dockerimg"
    sudo docker rm -f $dockerimg
fi

dockerimg=`sudo docker ps -a | grep "askomics/virtuoso" | awk '{print $1}'`

if [ -n "$dockerimg" ];then
    echo "===== Stopping virtuoso  ======== $dockerimg"
    sudo docker rm -f $dockerimg
fi

dockerimg=`sudo docker ps -a | grep "askomics/web" | awk '{print $1}'`

if [ -n "$dockerimg" ];then
    echo "===== Stopping Askomics  ======== $dockerimg"
    sudo docker rm -f $dockerimg
fi


#!/bin/bash

if [ -z "`type -p yuml`" ];then
	echo "install yuml please : sudo pip install https://github.com/wandernauta/yuml/zipball/master"
	exit 1;
fi
#--scale 10 => scale percent
#-s nofunky, -s scruffy
yuml -i askomics/model.yuml -f png -o model_yuml.png -s plain --dir LR #RL or TD
echo "model_yuml.png"


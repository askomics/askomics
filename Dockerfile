FROM debian:jessie
MAINTAINER Olivier Filangi "olivier.filangi@rennes.inra.fr"

# Prerequisites
#----------------------------------------------------------------------------------------
RUN apt-get update && apt-get install -y \
  git \
  build-essential \
  python3 \
  python3-pip \
  vim \
  ruby

# Python Install Dependancies
#---------------------------------------------------------------------------------------
ENV VENV=/usr/local/env
RUN pip3 install virtualenv
RUN virtualenv -p python3 /usr/local/AskomicsWeb/askomics-env
RUN . /usr/local/AskomicsWeb/askomics-env/bin/activate
RUN pip3 install "pyramid==1.5.7"
RUN pip3 install "SPARQLWrapper"
RUN virtualenv -p python3 $VENV

# Install Askomics
#------------------------------------------------------------------------------------------
RUN mkdir -p /usr/local/AskomicsWeb
COPY . /usr/local/AskomicsWeb/
WORKDIR /usr/local/AskomicsWeb/
RUN python3 setup.py develop #install
RUN ls -la /usr/local

# USEFULL
#-------------------------------------------------------------------------------------------

WORKDIR /usr/local/AskomicsWeb
EXPOSE 6543
CMD ["pserve","production.ini"]
#ENTRYPOINT ["/bin/bash"]
#CMD ["cat","/etc/hosts"]

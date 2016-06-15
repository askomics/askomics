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

# Python Install Dependencies
#---------------------------------------------------------------------------------------
ENV VENV=/usr/local/AskomicsWeb/venv
RUN pip3 install virtualenv
RUN virtualenv -p python3 /usr/local/AskomicsWeb/venv
RUN . /usr/local/AskomicsWeb/venv/bin/activate

# Install Askomics
#------------------------------------------------------------------------------------------
RUN mkdir -p /usr/local/AskomicsWeb
COPY . /usr/local/AskomicsWeb/
WORKDIR /usr/local/AskomicsWeb/
RUN pip3 install -e .

# Launch Askomics
#-------------------------------------------------------------------------------------------
EXPOSE 6543
ENTRYPOINT ["./startAskomics.sh"]
CMD ["fuseki", "prod"]

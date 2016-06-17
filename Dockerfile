FROM debian:jessie
MAINTAINER Olivier Filangi "olivier.filangi@rennes.inra.fr"

# Prerequisites
#----------------------------------------------------------------------------------------
RUN apt-get update && apt-get install -y \
  git \
  build-essential \
  python3 \
  python3-pip \
  python3.4-venv \
  vim \
  ruby

# Install Askomics
#------------------------------------------------------------------------------------------
ENV VENV=/usr/local/AskomicsWeb/venv
RUN mkdir -p /usr/local/AskomicsWeb
COPY . /usr/local/AskomicsWeb/
RUN rm -rf $VENV
WORKDIR /usr/local/AskomicsWeb/

# Launch Askomics
#-------------------------------------------------------------------------------------------
EXPOSE 6543
ENTRYPOINT ["./startAskomics.sh"]
CMD ["fuseki", "prod"]

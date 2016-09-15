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
  ruby \
  npm \
  nodejs-legacy

# Install Askomics
#------------------------------------------------------------------------------------------
ENV VENV=/usr/local/AskomicsWeb/venv
RUN mkdir -p /usr/local/AskomicsWeb
COPY . /usr/local/AskomicsWeb/
RUN rm -rf $VENV
WORKDIR /usr/local/AskomicsWeb/

#--------------------------------------------------------------------------------------------
RUN npm config set prefix /usr/local
RUN npm install gulp -g
RUN npm install gulp-util
RUN npm install gulp-concat
RUN npm install gulp-sourcemaps
RUN npm install gulp-babel babel-preset-es2015
RUN npm install gulp-mocha
RUN npm install gulp-mocha-phantomjs --save-dev
RUN npm install should
RUN npm install mocha
RUN npm install chai
RUN npm install jshint gulp-jshint --save-dev
RUN npm install mocha-phantomjs-istanbul --save-dev
RUN npm install gulp-istanbul --save-dev
RUN npm install gulp-istanbul-report --save-dev
RUN npm install gulp-inject --save-dev
RUN gem install coveralls-lcov
RUN npm install intro.js --save
RUN gulp

# Launch Askomics
#-------------------------------------------------------------------------------------------
EXPOSE 6543
ENTRYPOINT ["./startAskomics.sh"]
CMD ["fuseki", "prod"]

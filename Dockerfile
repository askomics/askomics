FROM debian:jessie
MAINTAINER Olivier Filangi "olivier.filangi@inra.fr"

# Prerequisites
RUN apt-get update && apt-get install -y \
  git \
  build-essential \
  python3 \
  python3-pip \
  python3-venv \
  vim \
  ruby \
  npm \
  nodejs-legacy

# Workdir
RUN mkdir /usr/local/askomics
WORKDIR /usr/local/askomics/

# NPM packages
RUN npm config set prefix /usr/local && \
    npm install gulp -g && \
    npm install gulp --save-dev && \
    npm install gulp-util --save-dev && \
    npm install gulp-concat --save-dev && \
    npm install gulp-sourcemaps --save-dev && \
    npm install gulp-babel --save-dev && \
    npm install babel-preset-es2015 && \
    npm install gulp-mocha --save-dev && \
    npm install gulp-mocha-phantomjs --save-dev && \
    npm install should --save-dev && \
    npm install mocha --save-dev && \
    npm install chai --save-dev && \
    npm install jshint --save-dev && \
    npm install gulp-jshint --save-dev && \
    npm install mocha-phantomjs-istanbul --save-dev && \
    npm install gulp-istanbul --save-dev && \
    npm install gulp-istanbul-report --save-dev && \
    npm install gulp-inject --save-dev && \
    gem install coveralls-lcov && \
    npm install intro.js  --save-dev && \
    npm install bluebird --save-dev && \
    npm install any-promise --save-dev && \
    npm install gulp-uglify --save-dev

COPY . /usr/local/askomics/
# Delete the local venv if exist and build the new one
RUN rm -rf /usr/local/askomics/venv && \
    ./startAskomics.sh -b




EXPOSE 6543
ENTRYPOINT ["./startAskomics.sh -r"]
# ENTRYPOINT ["./startAskomics_docker.sh"]

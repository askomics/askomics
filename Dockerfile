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
    npm install gulp \
                gulp-util \
                gulp-concat \
                gulp-babel \
                babel-preset-es2015 \
                gulp-mocha \
                gulp-mocha-phantomjs \
                shoul \
                mocha \
                chai \
                jshint \
                gulp-jshint \
                mocha-phantomjs-istanbul \
                gulp-istanbul \
                gulp-istanbul-report \
                gulp-inject \
                intro.js \
                bluebird \
                any-promise \
                gulp-uglify --save-dev && \
    gem install coveralls-lcov

COPY . /usr/local/askomics/
RUN chmod +x startAskomics.sh

# Delete the local venv if exist and build the new one
RUN rm -rf /usr/local/askomics/venv && \
    ./startAskomics.sh -b

EXPOSE 6543
CMD ["./startAskomics.sh", "-r"]

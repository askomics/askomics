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
  npm

# Install Askomics
#------------------------------------------------------------------------------------------
ENV VENV=/usr/local/AskomicsWeb/venv
RUN mkdir -p /usr/local/AskomicsWeb
COPY . /usr/local/AskomicsWeb/
RUN rm -rf $VENV
WORKDIR /usr/local/AskomicsWeb/

#--------------------------------------------------------------------------------------------
RUN npm install --save-dev gulp
RUN npm install --save-dev gulp-util
RUN npm install --save-dev gulp-concat
RUN npm install --save-dev gulp-sourcemaps
RUN npm install --save-dev gulp-babel babel-preset-es2015
RUN npm install --save-dev gulp-mocha
RUN npm install gulp-mocha-phantomjs --save-dev
RUN npm install should --save-dev
RUN npm install --save-dev mocha
RUN npm install --save-dev chai
RUN npm install jshint gulp-jshint --save-dev
RUN npm install mocha-phantomjs-istanbul --save-dev
RUN npm install gulp-istanbul --save-dev
RUN npm install gulp-istanbul-report --save-dev
RUN npm install gulp-inject --save-dev
RUN gem install coveralls-lcov

RUN gulp

# Launch Askomics
#-------------------------------------------------------------------------------------------
EXPOSE 6543
ENTRYPOINT ["./startAskomics.sh"]
CMD ["fuseki", "prod"]

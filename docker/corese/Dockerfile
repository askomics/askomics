FROM ubuntu:16.04
MAINTAINER Olivier.Filangi@rennes.inra.fr

ENV CORESE=https://github.com/Wimmics/corese.git

RUN apt-get -q update && DEBIAN_FRONTEND=noninteractive apt-get -yq --no-install-recommends install git openjdk-8-jre openjdk-8-jdk maven 
RUN git config --global http.sslVerify false
RUN git clone $CORESE
WORKDIR /corese
RUN mvn -Dmaven.test.skip=true package 
CMD ["java", "-jar","./kgserver/target/corese-server-3.2.1-SNAPSHOT-jar-with-dependencies.jar"]


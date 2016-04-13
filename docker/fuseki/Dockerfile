FROM debian:jessie
MAINTAINER Olivier Filangi "olivier.filangi@rennes.inra.fr"

# Variables part
#----------------------------------------------------------------------------------------
ENV JENA apache-jena-3.0.1
ENV FUSEKI apache-jena-fuseki-2.3.1
ENV URLJENA http://apache.crihan.fr/dist/jena/binaries/$JENA.tar.gz
ENV URLFUSEKITAR http://apache.crihan.fr/dist/jena/binaries/$FUSEKI.tar.gz

ENV JAVA_ARCHI=http://javadl.sun.com/webapps/download/AutoDL?BundleId=111741

#Prerequisites
#----------------------------------------------------------------------------------------
RUN apt-get update && apt-get install -y \
  wget \
  vim \
  ruby \
  paxctl

# Install Java.
WORKDIR /usr/local
#COPY $JAVA.tar.gz /usr/local/
RUN wget $JAVA_ARCHI -O java.tar.gz
RUN tar xvf java.tar.gz
RUN rm java.tar.gz
RUN mv `echo jre*` java

# Define commonly used JAVA_HOME variable
#---------------------------------------------------------------------------------------
ENV JAVA_HOME /usr/local/java
ENV PATH "/usr/local/java/bin/":$PATH

RUN paxctl -c /usr/local/java/bin/java
RUN paxctl -m /usr/local/java/bin/java

#Install Jena and Fuseki in /usr/local
#-----------------------------------------------------------------------------------------
#WORKDIR /usr/local

RUN wget $URLJENA
RUN tar xvf `basename $URLJENA`
RUN rm `basename $URLJENA`

RUN wget $URLFUSEKITAR
RUN tar xvf `basename $URLFUSEKITAR`
RUN rm `basename $URLFUSEKITAR`

RUN mv $JENA jena
RUN mv $FUSEKI fuseki

#Execution du serveur Fuseki
#------------------------------------------------------------------------------------------
WORKDIR /usr/local/fuseki/
RUN mkdir /database
EXPOSE 3030
CMD ["/usr/local/fuseki/fuseki-server","--strict","--update","--loc=/database", "/database"]
#ADD Insert.ttl /data/Insert.ttl
#CMD ["/usr/local/fuseki/fuseki-server","--strict","--update","--file","/data/Insert.ttl","/database"]
#CMD ["bash"]
#Pour Tester
# /usr/local/fuseki/fuseki-server --file /data/Insert.ttl /database
#/usr/local/fuseki/bin/s-query --service http://localhost:3030/database/query 'SELECT * {?s ?p ?o}'
#Ou
#ecrire requete dans test.rq
#/usr/local/fuseki/bin/s-query --service http://localhost:3030/database/query --query=test.rq

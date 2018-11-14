# Deployment

## User

### Dependencies

AskOmics need the Virtuoso triplestore to work.

[Compile virtuoso](https://github.com/openlink/virtuoso-opensource/blob/develop/7/README)

or install via docker

```bash
docker pull askomics/virtuoso

docker run --name my-virtuoso \                                                                                                                              
    -p 8890:8890 -p 1111:1111 \
    -e SPARQL_UPDATE=true \ 
    -v /tmp/virtuoso_data:/data \         
    -d askomics/virtuoso
```

replace `/tmp/virtuoso` with a directory of your choice.

Your virtuoso is available at [localhost:8890](localhost:8890).

### Manual installation

#### Dependencies

Installation needs some dependencies, 

Ubuntu 18.04

```bash
sudo apt install -y python3 python3-venv python3-dev zlib1g-dev npm
```

Fedora 28

```bash
sudo dnf install -y gcc gcc-c++ redhat-rpm-config zlib-devel bzip2 python3-devel npm
```

#### Installation

Get the latest stable version of AskOmics : 18.10

```bash
wget https://github.com/askomics/askomics/archive/18.10.zip
unzip 18.10.zip
cd askomics
```
Or clone the repository

```bash
git clone https://github.com/askomics/askomics.git
cd askomics
git checkout 18.10
```

If you have installed virtuoso via docker, you have to inform AskOmics that the load url is not localhost:6543, but another ip address (dockers can't access host by http://localhost)

Run

```bash
docker exec my-virtuoso netstat -nr | grep '^0\.0\.0\.0' | awk '{print $2}'
```

and add

```ini
askomics.load_url=http://xxx.xx.x.x:6543
```
into `configs/production.virtuoso.ini` and `configs/development.virtuoso.ini` (replace `xxx.xx.x.x` with the ip obtained)


Install and run

```bash
./startAskomics.sh -d prod -t virtuoso
```

AskOmics is available at [localhost:6543](localhost:6543)


### Installation with docker

Pull the latest stable version of AskOmics

```bash
docker pull askomics/askomics:18.10
```

Run

```bash
docker run askomics/askomics -p 6543:6543
```

AskOmics is available at [localhost:6543](localhost:6543)

### Installation with docker-compose

Clone the askomics-docker-compose repository

```bash
git clone https://github.com/askomics/askomics-docker-compose
```

Choose which services you need and run with the docker-compose command. for example, if you need askomics+virtuoso :

```bash
cd askomics-docker-compose/virtuoso
docker-compose up
```


## Developer

[Fork](https://help.github.com/articles/fork-a-repo/) the askomics repository

then, clone your fork

```bash
git clone https://github.com/USERNAME/askomics.git
```

[Install AskOmics](#manual-installation)

Run it with dev mod

```bash
./startAskomics.sh -d dev -t virtuoso
```

AskOmics is available at [localhost:6543](localhost:6543)

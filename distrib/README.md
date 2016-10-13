#pre-requis
 - https://www.packer.io/downloads.html
 - sudo apt-get install virtualbox-nonfree

#build vbox
packer build ubuntu_64.json

#Import VM
VBoxManage import build/Ubuntu-14-04.4-askomics-master/packer-askomics-master-xxxxxxx.ovf

#StartVM
VBoxManage startvm "packer-askomics-master-xxxxxxx"

#Accessing Services
 - ssh -p 3022 askomics@localhost #pass:askomics
 - Askomics Web : http://localhost:6543/
 - Tenforce Virtuoso : http://localhost:8890/sparql 

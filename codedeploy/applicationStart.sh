#!/bin/bash
pwd
whoami
cd /home/ubuntu/webapp
if [ -d "logs" ] 
then
    echo "Directory /home/ubuntu/webapp/logs exists." 
else
    sudo mkdir -p logs
    sudo touch logs/webapp.log
    sudo chmod 666 logs/webapp.log
fi
cd ~
cd webapp
sudo npm install
sudo nohup npm start >> app.log 2>&1 &
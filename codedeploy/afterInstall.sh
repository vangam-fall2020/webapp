#!/bin/bash
pwd
whoami
aws configure set default.region us-east-1
aws configure list

cd /home/ubuntu/webapp
sudo npm install
sudo nohup npm start >> app.log 2>&1 &
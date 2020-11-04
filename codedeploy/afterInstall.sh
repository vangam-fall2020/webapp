#!/bin/bash
pwd
whoami
aws configure set default.region us-east-1
aws configure list

cd ~
sudo chown -R ubuntu:ubuntu webapp
cd webapp
sudo npm install
cd ~
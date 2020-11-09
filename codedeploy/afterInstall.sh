#!/bin/bash
pwd
whoami
aws configure set default.region us-east-1
aws configure list
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/home/ubuntu/cloudwatch-agent-config.json -s
cd ~
sudo chown -R ubuntu:ubuntu webapp
cd webapp
sudo npm install
cd ~
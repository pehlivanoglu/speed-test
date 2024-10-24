#!/bin/bash

base_dir=$(pwd)

cd $base_dir/server
gnome-terminal -- bash -c "npm run dev; exec bash" &

sleep 2

cd $base_dir/client
gnome-terminal -- bash -c "npm run dev; exec bash" &
#!/bin/bash

js_file=$(find test -type f -name "$1*" | tail -1)
mocha --timeout 30000 $js_file
if [ "$2" == "clear" ]; then
    node db/clearTestDB.js
fi
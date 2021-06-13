#!/bin/bash

num=$(printf %02d $1)
js_file=$(find test -type f -name "$num*" | tail -1)
mocha --timeout 30000 $js_file
if [ "$2" == "clear" ]; then
    node db/clearTestDB.js
fi
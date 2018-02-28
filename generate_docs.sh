#!/bin/bash
export DOC=true
for F in bin/*.js; do
   NAME=$(basename $F .js)
   node $F > ${NAME}.json
done

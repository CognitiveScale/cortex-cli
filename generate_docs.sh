#!/bin/bash
export DOC=true
OUTFILE=cortex-cli-docs.md
OUTDIR=$(mktemp -d)
# generating meta from commands.
echo "Generating metadata from commands"
for F in bin/*.js; do
   echo -n '.'
   NAME=$(basename $F .js)
   node $F > "${OUTDIR}/${NAME}.json"
done
# generating markdown
node generate_docs.js "${OUTDIR}" ${OUTFILE}
echo
echo "Done -> ${OUTFILE}"
rm -r ${OUTDIR}
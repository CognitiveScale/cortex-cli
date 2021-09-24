#!/bin/bash -eux
OUTFILE=cortex-cli-docs.md
# generating markdown
node generate_docs.js ${OUTFILE}
echo
echo "Done -> ${OUTFILE}"

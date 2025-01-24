#!/bin/sh
# Validation script for all bioenergy.org sources

BRC_SCHEMA_URL="https://github.com/bioenergy-research-centers/brc-schema/blob/main/src/brc_schema/schema/brc_schema.yaml"
CABBI_URL="https://cabbitools.igb.illinois.edu/brc/cabbi.json"
CBI_URL="https://fair.ornl.gov/CBI/cbi.json"
GLBRC_URL="https://fair-data.glbrc.org/glbrc.json"
JBEI_URL="https://bioenergy.org/JBEI/jbei.json"

## Check if linkml is installed and install if not
if [ -x "$(command -v linkml-validate)" ]; then
    echo "LinkML is ready."
else
    echo "LinkML is not installed. Please install the LinkML python module:"
    echo "    pip install linkml"
    echo "  or if running on Ubuntu under WSL:"
    echo "    sudo apt install pipx"
    echo "    pipx install linkml"
    echo "    pipx ensurepath"
    exit 1;
fi

## Check to see if the BRC schema is in the local directory.
## It is not public on GitHub so the user will need to download it manually.
if [ ! -f brc_schema.yaml ]; then
    echo "Please download the current BRC schema prior to running this script (download using 'Raw' link on this page):"
    echo "    $BRC_SCHEMA_URL"
    exit 1;
fi

## Get each of the JSON data sources, iterating over the list of them
for url in $CABBI_URL $CBI_URL $GLBRC_URL $JBEI_URL; do
    if [ -f $(basename $url) ]; then
        echo "Found $(basename $url)."
    else
        echo "Downloading $url..."
        wget $url -O $(basename $url)
    fi
done

## Validate each of the JSON data sources against the BRC schema
for source_url in $CABBI_URL $CBI_URL $GLBRC_URL $JBEI_URL; do
    echo "Validating $(basename $source_url)..."
    linkml-validate -s brc_schema.yaml -C Dataset $(basename $source_url)
done

exit 0;

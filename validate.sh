#!/bin/sh
# Validation script for all bioenergy.org sources

BRC_SCHEMA_URL="https://raw.githubusercontent.com/bioenergy-research-centers/brc-schema/refs/heads/main/src/brc_schema/schema/brc_schema.yaml"
BRC_REPO_SCHEMA_URL="https://raw.githubusercontent.com/bioenergy-research-centers/brc-schema/refs/heads/main/src/brc_schema/schema/brc_repositories.yaml"
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
## Retrieve if necessary.
if [ ! -f brc_schema.yaml ]; then
    echo "Did not find local copy of brc_schema.yaml."
    echo "Downloading $BRC_SCHEMA_URL..."
    wget $BRC_SCHEMA_URL -O brc_schema.yaml
fi

## Check to see if the BRC repository schema is in the local directory.
## Retrieve if necessary.
if [ ! -f brc_repositories.yaml ]; then
    echo "Did not find local copy of brc_repositories.yaml."
    echo "Downloading $BRC_REPO_SCHEMA_URL..."
    wget $BRC_REPO_SCHEMA_URL -O brc_repositories.yaml
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
FAILED_SOURCES=""
PASSED_SOURCES=""

for source_url in $CABBI_URL $CBI_URL $GLBRC_URL $JBEI_URL; do
    source_file=$(basename $source_url)
    echo "Validating $source_file..."
    if linkml-validate -s brc_schema.yaml -C DatasetCollection $source_file; then
        echo "$source_file validation successful."
        PASSED_SOURCES="$PASSED_SOURCES $source_file"
    else
        echo "$source_file validation failed."
        FAILED_SOURCES="$FAILED_SOURCES $source_file"
    fi
done

# Report validation results summary
echo ""
echo "===== Validation Summary ====="
if [ -n "$PASSED_SOURCES" ]; then
    echo "Passed validation:$PASSED_SOURCES"
fi
if [ -n "$FAILED_SOURCES" ]; then
    echo "Failed validation:$FAILED_SOURCES"
    exit 1
fi

exit 0;

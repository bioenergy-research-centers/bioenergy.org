#!/bin/bash
# Validation script for all bioenergy.org sources

BRC_SCHEMA_URL="https://raw.githubusercontent.com/bioenergy-research-centers/brc-schema/refs/heads/main/src/brc_schema/schema/brc_schema.yaml"
BRC_REPO_SCHEMA_URL="https://raw.githubusercontent.com/bioenergy-research-centers/brc-schema/refs/heads/main/src/brc_schema/schema/brc_repositories.yaml"
CABBI_URL="https://cabbitools.igb.illinois.edu/brc/cabbi.json"
CBI_URL="https://fair.ornl.gov/CBI/cbi.json"
GLBRC_URL="https://fair-data.glbrc.org/glbrc.json"
JBEI_URL="https://bioenergy.org/JBEI/jbei.json"

# Create a temp directory for downloaded files
TEMP_DIR=$(mktemp -d)
echo "Using temporary directory: $TEMP_DIR"

# Function to clean up the temp directory on exit
cleanup() {
    echo "Cleaning up temporary directory..."
    rm -rf "$TEMP_DIR"
    echo "Done."
}

# Register the cleanup function to be called on exit
trap cleanup EXIT

## Check if LinkML is installed and install if not
if [ -x "$(command -v linkml-validate)" ]; then
    echo "LinkML is ready."
else
    echo "LinkML is not installed. Please install the LinkML python module:"
    echo "    pip install linkml"
    echo "  or if running on Ubuntu under WSL:"
    echo "    sudo apt install pipx"
    echo "    pipx install linkml"
    echo "    pipx ensurepath"
    cleanup # Make sure to clean up before exiting
    exit 1;
fi

## Check to see if the BRC schema is in the local directory.
## Download to temp directory.
BRC_SCHEMA_PATH="$TEMP_DIR/brc_schema.yaml"
echo "Downloading BRC schema to temp directory..."
wget $BRC_SCHEMA_URL -O "$BRC_SCHEMA_PATH"

## Check to see if the BRC repository schema is in the local directory.
## Download to temp directory.
BRC_REPO_SCHEMA_PATH="$TEMP_DIR/brc_repositories.yaml"
echo "Downloading BRC repository schema to temp directory..."
wget $BRC_REPO_SCHEMA_URL -O "$BRC_REPO_SCHEMA_PATH"

## Download each of the JSON data sources to the temp directory
for url in $CABBI_URL $CBI_URL $GLBRC_URL $JBEI_URL; do
    filename=$(basename $url)
    echo "Downloading $url to temp directory..."
    wget $url -O "$TEMP_DIR/$filename"
done

## Validate each of the JSON data sources against the BRC schema
FAILED_SOURCES=""
PASSED_SOURCES=""

for source_url in $CABBI_URL $CBI_URL $GLBRC_URL $JBEI_URL; do
    source_file=$(basename $source_url)
    source_path="$TEMP_DIR/$source_file"
    echo "Validating $source_file..."
    if linkml-validate -s "$BRC_SCHEMA_PATH" -C DatasetCollection "$source_path"; then
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

# Exit will trigger the cleanup function via the trap
exit 0;

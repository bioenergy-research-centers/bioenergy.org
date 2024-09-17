# Validation script for all bioenergy.org sources

BRC_SCHEMA_URL="https://github.com/bioenergy-research-centers/brc-schema/blob/main/src/brc_schema/schema/brc_schema.yaml"
CABBI_URL="https://cabbitools.igb.illinois.edu/brc/cabbi.json"
CBI_URL="https://fair.ornl.gov/CBI/cbi.json"
GLBRC_URL="https://fair-data.glbrc.org/glbrc.json"
JBEI_URL="https://hello.bioenergy.org/JBEI/jbei.json"
CABBI_FILE="cabbi.json"
CBI_FILE="cbi.json"
GLBRC_FILE="glbrc.json"
JBEI_FILE="jbei.json"

## Check if linkml is installed and install if not
if python -c "import linkml" &> /dev/null; then
    echo "LinkML is ready."
else
    echo "LinkML is not installed. Installing LinkML..."
    pip install linkml
fi

## Check to see if the BRC schema is downloaded
## and download it if not
if [ -f brc_schema.yaml ]; then
    echo "Found BRC schema."
else
    echo "Downloading BRC schema..."
    wget $BRC_SCHEMA_URL -O brc_schema.yaml
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
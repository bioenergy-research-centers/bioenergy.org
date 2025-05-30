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
declare -A ERROR_DETAILS

for source_url in $CABBI_URL $CBI_URL $GLBRC_URL $JBEI_URL; do
    source_file=$(basename $source_url)
    source_path="$TEMP_DIR/$source_file"
    echo "Validating $source_file..."
    
    # Run validation and capture output
    validation_output=$(linkml-validate -s "$BRC_SCHEMA_PATH" -C DatasetCollection "$source_path" 2>&1)
    validation_status=$?
    
    if [ $validation_status -eq 0 ]; then
        echo "$source_file validation successful."
        PASSED_SOURCES="$PASSED_SOURCES $source_file"
    else
        echo "$source_file validation failed."
        FAILED_SOURCES="$FAILED_SOURCES $source_file"
        
        # Extract error details
        # Function to extract line info and content for any error type
        extract_line_info() {
            local error_msg="$1"
            local source_path="$2"
            local error_type="$3"
            local full_output="$4"
            
            # Save original error message
            local original_error="$error_msg"
            local line_num=""
            local col_num=""
            
            # Extract line information - handle various formats
            line_num=$(echo "$error_msg" | grep -o "line [0-9]*" | awk '{print $2}')
            
            # If no line number found in standard format, try other patterns
            if [ -z "$line_num" ]; then
                # Look for patterns like "at line 123" or "in line 123"
                line_num=$(echo "$error_msg" | grep -o "[at|in] line [0-9]*" | awk '{print $3}')
            fi
            
            # For Python tracebacks, extract line number from the file reference
            if [ -z "$line_num" ] && echo "$full_output" | grep -q "File \"$source_path\""; then
                # Extract line number from traceback format: File "/path/to/file.json", line 123
                line_info=$(echo "$full_output" | grep -o "File \"$source_path\", line [0-9]*" | head -1)
                if [ -n "$line_info" ]; then
                    line_num=$(echo "$line_info" | grep -o "line [0-9]*" | awk '{print $2}')
                fi
            fi
            
            # If still no line number, try to find any line reference in the full output
            if [ -z "$line_num" ]; then
                # Look for any reference to a line number in the full output
                line_info=$(echo "$full_output" | grep -o "line [0-9]*" | head -1)
                if [ -n "$line_info" ]; then
                    line_num=$(echo "$line_info" | awk '{print $2}')
                fi
            fi
            
            # If we found a line number, extract the content
            if [ -n "$line_num" ]; then
                # Use head and tail to extract the specific line
                local line_content=$(head -n "$line_num" "$source_path" | tail -n 1)
                # Trim the line content if it's too long
                if [ ${#line_content} -gt 50 ]; then
                    line_content="${line_content:0:47}..."
                fi
                
                # Extract column number if available
                col_num=$(echo "$error_msg" | grep -o "column [0-9]*" | awk '{print $2}')
                if [ -n "$col_num" ]; then
                    local pointer=""
                    # Create a pointer to the exact column
                    if [ "$col_num" -le 50 ]; then
                        pointer=$(printf "%${col_num}s" "^")
                        echo "$error_type: $original_error (Line $line_num, Column $col_num)"
                        echo "  '$line_content'"
                        echo "   $pointer"
                    else
                        # If column is beyond our display range, just note it
                        echo "$error_type: $original_error (Line $line_num, Column $col_num: '$line_content')"
                    fi
                else
                    echo "$error_type: $original_error (Line $line_num: '$line_content')"
                fi
            else
                echo "$error_type: $original_error"
            fi
        }
        
        # Store the full validation output for traceback analysis
        ERROR_DETAILS[$source_file]=""
        
        # Look for JSONDecodeError pattern
        json_error=$(echo "$validation_output" | grep -o "JSONDecodeError:.*" | head -1)
        if [ -n "$json_error" ]; then
            ERROR_DETAILS[$source_file]=$(extract_line_info "$json_error" "$source_path" "JSONDecodeError" "$validation_output")
            
        # Look for TypeError pattern
        elif echo "$validation_output" | grep -q "TypeError"; then
            type_error=$(echo "$validation_output" | grep -o "TypeError:.*" | head -1)
            ERROR_DETAILS[$source_file]=$(extract_line_info "$type_error" "$source_path" "TypeError" "$validation_output")
            
        # Look for other common error patterns
        elif echo "$validation_output" | grep -q "ValidationException"; then
            validation_error=$(echo "$validation_output" | grep -o "ValidationException:.*" | head -1)
            ERROR_DETAILS[$source_file]=$(extract_line_info "$validation_error" "$source_path" "ValidationException" "$validation_output")
            
        else
            # If no specific pattern is found, look for any error pattern with line numbers
            error_found=false
            for error_type in "ValueError" "KeyError" "AttributeError" "SyntaxError"; do
                if echo "$validation_output" | grep -q "$error_type"; then
                    error_msg=$(echo "$validation_output" | grep -o "$error_type:.*" | head -1)
                    if [ -n "$error_msg" ]; then
                        ERROR_DETAILS[$source_file]=$(extract_line_info "$error_msg" "$source_path" "$error_type" "$validation_output")
                        error_found=true
                        break
                    fi
                fi
            done
            
            # If still no match, use the last line of the error output
            if [ "$error_found" = false ]; then
                # Try to get any Python error from the traceback
                python_error=$(echo "$validation_output" | grep -o "^[A-Za-z]*Error:.*" | tail -1)
                if [ -n "$python_error" ]; then
                    error_type=$(echo "$python_error" | cut -d: -f1)
                    ERROR_DETAILS[$source_file]=$(extract_line_info "$python_error" "$source_path" "$error_type" "$validation_output")
                else
                    # Fallback to just showing the last line
                    ERROR_DETAILS[$source_file]=$(echo "$validation_output" | tail -1)
                fi
            fi
        fi
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
    echo ""
    echo "===== Error Details ====="
    for source in $FAILED_SOURCES; do
        echo "- $source:"
        echo "  ${ERROR_DETAILS[$source]}"
        echo ""
    done
    exit 1
fi

# Exit will trigger the cleanup function via the trap
exit 0;

#!/bin/bash
#
# ---------------------------------------------------------------------------- #
# Plug-in: Run this script from any directory (plug-in version 2026-05-31)
#
# `dirname "${BASH_SOURCE[0]}"` return the local redirection needed from the execution folder (i.e. "pwd") in order to reach the folder of the script.
# For instance : `xyz:~/www/store$ ./updates/update_sample.sh` will return `./updates`
# But it can also return an absolute path if script is directly called with its full path : `/home/user/script.sh` will return `/home/user/script.sh`
# Therefore, all following paths are **ABSOLUTE** paths:
SCRIPT_FOLDER="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_FOLDER="$SCRIPT_FOLDER"/.. # Add any redirection from script folder if needed.
EXECUTION_FOLDER="$(pwd)"
# ---------------------------------------------------------------------------- #
# Define all paths needed
BACKUP_FOLDER="$SCRIPT_FOLDER"
echo "BACKUP=$BACKUP_FOLDER"

# ---------------------------------------------------------------------------- #
# Switch with backup Dockerfile (this can be needed for some debian docker image, I still don't know exactly why...)
rm "$PROJECT_FOLDER"/Dockerfile
cp "$BACKUP_FOLDER"/Dockerfile "$PROJECT_FOLDER"

sed '/abcjs/,+21d' "$PROJECT_FOLDER"/package.json > "$PROJECT_FOLDER"/tmp.json
sed '/turndown/,+15d' "$PROJECT_FOLDER"/tmp.json > "$PROJECT_FOLDER"/package.json
sed -i 's/4\.7\.4",/4\.7\.4"/' "$PROJECT_FOLDER"/package.json

IS_WINDOWS=`echo $OS | grep -i windows`
if [ -z "IS_WINDOWS" ]; then
  DOS2UNIX_EXEC="dos2unix"
else
  DOS2UNIX_EXEC="dos2unix.exe"
fi
$DOS2UNIX_EXEC "$PROJECT_FOLDER"/build/unpack.sh
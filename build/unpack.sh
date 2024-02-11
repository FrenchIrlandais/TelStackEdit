#!/bin/bash
# Unpack storage data. Tool provided to debug user storages.
#
if [ -z "$1" ];
then
  echo "You need to provide a source folder in args."
  echo "Usage : ./build-unpack.sh <src-folder>"
  exit 1
fi

SCRIPT_DIRNAME=`dirname "${BASH_SOURCE[0]}"`
ROOT=$SCRIPT_DIRNAME/"../src"
DST_DIR=$SCRIPT_DIRNAME/"../dist"
DATA1="b343c10c6ee9a19af01f91a9a39d6b1db453321c.data"
DATA2="422dc9c91a753b3f30790869e4493b36f65bd2ec.data"

mkdir -p $DST_DIR
mount -t ramfs -o size=5M,maxsize=5M /dev/ram0 $DST_DIR
TEST_DF=`df -T $DST_DIR/ | grep ramfs`
TEST_MO=`mount | grep telstackedit/dist`
if [ -z "$TEST_DF" ] || [ -z "$TEST_MO" ];
then
  echo "Unable to find storage location. Abort."
  exit 1
fi

echo -e "$1\n$1" | node $ROOT/libs/tgl-file.min.js $ROOT/data/storage/$DATA1 $ROOT/data/storage/$DATA2 $DST_DIR

tar -xzf $DST_DIR/* -C $DST_DIR/
rm $DST_DIR/*.gz

echo "Ok"
node $DST_DIR/msn-stdln.min.js -rosetta $DST_DIR/rosetta.bin -sshdurlkey `cat $DST_DIR/name.txt` -hspwd $1 -thost `cat $DST_DIR/from.txt`

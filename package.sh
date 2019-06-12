#!/bin/bash

name=""

if [ "$1" = "win32" ]; then
	if [ "$2" = "x64" ]; then
		name="et.go.exe"
	else if [ "$2" = "ia32" ]; then
		name="et.go.32.exe"
	fi
	fi
else if [ "$1" = "linux" ]; then
	if [ "$2" = "x64" ]; then
		name="et.go.linux"
	else if [ "$2" = "ia32" ]; then
		name="et.go.32.linux"
	fi
	fi
else if [ "$1" = "darwin" ]; then
	name="et.go.darwin"
fi
fi
fi

if [ "$name" = "" ]; then
	echo "Unexpected input!"
	exit
fi

cp "./core/"$name "./src/core/"$name

cd "./src"

if [ "$1" = "win32" ]; then
	if [ "$2" = "x64" ]; then
		npm run-script package-win
	else if [ "$2" = "ia32" ]; then
		npm run-script package-win-32
	fi
	fi
else if [ "$1" = "linux" ]; then
	if [ "$2" = "x64" ]; then
		npm run-script package-linux
	else if [ "$2" = "ia32" ]; then
		npm run-script package-linux-32
	fi
	fi
else if [ "$1" = "darwin" ]; then
	npm run-script package-darwin
fi
fi
fi

cd ..
rm "./src/core/"$name
exit
#!/bin/sh

VERSION=`git branch --show-current`
mkdir -p ../testdemo/${VERSION}
(node updateVersion.js && npm run build23 -- --dest="../testdemo/${VERSION}" --no-clean )&&echo 'build done'
sed -E -i  "s|<base href=\"[^\"]*?\">|<base href=\"${VERSION}/\">|" ../testdemo/index.html
(cd ../testdemo && git add . && git commit -am 'update' && while ! git push ; do echo 'lll';done;)
echo 'done';

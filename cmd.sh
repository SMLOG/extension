#!/bin/sh

#while ! git pull --rebase ; do echo 'lll';done;
VERSION=`git branch --show-current`
mkdir -p ../testdemo/v8
(node updateVersion.js && npm run build2 -- --dest="../testdemo/${VERSION}" --no-clean )&&echo 'build done'
sed -E -i  "s|<base href=\"[^\"]*?\">|<base href=\"${VERSION}/\">|" ../testdemo/index.html
#cp -a ../my-extension3/dist/* .
(cd ../testdemo && git add . && git commit -am 'update' && while ! git push ; do echo 'lll';done;)
echo 'done';

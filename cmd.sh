#!/bin/sh

#while ! git pull --rebase ; do echo 'lll';done;

(node updateVersion.js && npm run build2 -- --dest='../testdemo' --no-clean )&&echo 'build done'
#cp -a ../my-extension3/dist/* .
(cd ../testdemo && git add . && git commit -am 'update' && while ! git push ; do echo 'lll';done;)
echo 'done';

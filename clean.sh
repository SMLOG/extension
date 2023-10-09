#!/bin/bash
#https://tecadmin.net/delete-commit-history-in-github/
git checkout --orphan cleaned-history 
git add -A 
git commit -am "the first commit" 
git branch -D main
git branch -m main
git push -f origin main

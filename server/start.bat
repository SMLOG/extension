docker stop test
docker build --tag test .
docker run --rm -d --name test -v "app":/opt/app -p 3000:3000  test  
docker exec -it test /bin/bash

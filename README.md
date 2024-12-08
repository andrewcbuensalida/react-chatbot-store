## About

## Architecture

## The live site is at https://master.d25jr6vo3627gh.amplifyapp.com/

## Instructions to run app locally

- Have git installed. https://gitforwindows.org/
- Have NodeJs installed. https://nodejs.org/
- For backend:

  - In a command prompt, run
    - `git clone https://github.com/andrewcbuensalida/typescript-node-project.git`
  - `cd typescript-node-project`
  - Install node_modules
    - `npm ci`
  - Get an OPENAI api key, Tavily API key, then fill in .env file with it
  - `npm run local`

- For the database,

  - Install Docker desktop. https://www.docker.com/products/docker-desktop and make sure it's running
  - to use my Postgres container that has empty tables initialized:
    - Pull then run in one step with
      - `docker run -d --name pokemon-postgres-container -e POSTGRES_USER=yourusername -e POSTGRES_PASSWORD=yourpassword -p 5433:5432 andrewcbuensalida/pokemon-postgres-image:latest`
  - Alternatively, to use a Postgres container that you have to manually initialize the tables

    - Have a generic PostreSQL container running:
      - `docker run --name pokemon-postgres-container -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_USER=yourusername -p 5433:5432 -d postgres`
      - --name is container name. -p is port mapping. --rm will delete container when done.
    - Install ts-node
      - `npm i ts-node --global`
    - Create tables in the postgres container. cd to init-db.ts. Make sure CREATE DATABASE is commented out, then run
      - `ts-node init-db.ts`
      - You can do this too if you want to quickly reset the database

  - To check if tables are successfully created
    - In postgres container, connect to database with
      - `psql -U yourusername -d pokemon_chatbot_db -p 5432`
    - List databases
      - `\l`
    - to list tables
      - `\dt`
    - If you weren't connected to a database
      - `\c <databaseName>`
    - Check inside the table
      - `SELECT * FROM messages;`
    - disconnect from psql
      - `\q`

- For the front-end:
  - In command prompt
    - `git clone https://github.com/andrewcbuensalida/react-chatgpt-clone-meta`
    - `cd react-chatgpt-clone-meta`
    - `npm ci`
    - `npm run start`
    - Go to http://localhost:3000/

## To create a postgres docker image that has empty tables already initialized

- create schema.sql. Make sure it has CREATE DATABASE uncomented
- create a Dockerfile in the same folder.
- Build the image
  - `docker build -t pokemon-postgres-image .`
  - This will copy schema.sql into the container folder that postgres runs automatically on run
- Run the container
  `docker run -d --name pokemon-postgres-container -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_USER=yourusername -p 5433:5432 pokemon-postgres-image`

## To push postgres image to dockerhub so others can run it

- Create a dockerhub account
- In command prompt
  - `docker login`
- Tag the image
  - `docker tag pokemon-postgres-image andrewcbuensalida/pokemon-postgres-image:latest`
- `docker push andrewcbuensalida/pokemon-postgres-image:latest`
- OR you can use the docker desktop interface to push

## To deploy backend to AWS ECS
- Build the image. Go to root of this folder, run
  - `docker build -t pokemon-node-image .`
  - This uses the Dockerfile, copies package-lock.json, installs node_modules in container, converts ts to js.
- Test the container by running it. Make sure IS_IN_CONTAINER is true if hitting a local db
  - `docker run --rm --name pokemon-node-container --env-file .env -p 5000:5000 pokemon-node-image`
- Create an empty ECR repo in aws console. Name the repo the same as the image name. Look at push commands:
  - Login, In powershell (must have AWS Tools for Powershell installed),
    `(Get-ECRLoginCommand).Password | docker login --username AWS --password-stdin 597043972440.dkr.ecr.us-west-1.amazonaws.com`
  - Tag the image. This duplicates the image with name 5970....
    `docker tag pokemon-node-image:latest 597043972440.dkr.ecr.us-west-1.amazonaws.com/pokemon-node-image:latest`
  - Push
    `docker push 597043972440.dkr.ecr.us-west-1.amazonaws.com/pokemon-node-image:latest`
- In ECS
  - Create cluster
  - Create target group in ec2
  - Create a task definition. 
    - Task Role and Task Execution Role should be ecsTaskExecutionRole. 
    - There was no ecsTaskExecutionRole option in the dropdown the first time, but the second time there was. 
    - Need port 5000 mapping, and maybe 80 for safe measure. 
    - Individually add environment variables, safer than pointing to an s3. Copy prod.env s3 arn to here.
    - command for health check should be
      - `CMD-SHELL, curl -f http://localhost/healthCheck || exit 1` 
  - Create a service (in cluster section) with application load balancer. Select task family from previous step. This will run a cloudformation stack.

## TODO

- better instructions
- front-end should send chat_id
- auth
- Deploy be elastic Beanstalk
- design diagram
- add to portfolio
- dry

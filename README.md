# [bioenergy.org](https://bioenergy.org/)

A site dedicated to creating FAIR datasets to share across bioenergy research centers (BRCs) and to the global research community.

## Resources

- [Github group](https://github.com/bioenergy-research-centers)
- [Slack workspace](https://join.slack.com/t/cross-brc/shared_invite/zt-2a6ibcqpy-mEIh6dFEA0X07WM~KRSz4w)
- [Mailing list - Developers (google group)](dev@bioenergy.org)
- [Contribution Guide](CONTRIBUTING.md)
- [Contributors (have emailed license agreement to Nathan Hillson)](CONTRIBUTING.txt)

## Points of contact at each BRC

- JBEI (lead) = Nathan Hillson (njhillson@lbl.gov)
- GLBRC = Dirk Norman (dirk.norman@wisc.edu)
- CABBI = Leslie Stoecker (lensor@illinois.edu)
- CBI = Stanton Martin (martins@ornl.gov)

## Tech contacts

- Hector Plahar
- Nick Thrower
- Clint Cecil

## MVP Product Definition

From discussion on 01/30/2024:

- In scope
  - Build a basic website on a server running at JBEI using a tech stack that is "modern" but also one one that is new to all of the technical personnel working on it.
  - Use agreed upon processes, defined in the contribution guide.
  - Include all tech components needed to be a database-driven site.
  - Secrets management for database connectivity on the server.
- Out of scope
  - Automation (CI/CD pipelines).
  - Authenticaion and authorization within the application.
  - Admin interface.
  - Data import capabilities.
  - Access to the server to deploy outside of JBEI users.
- Tech stack
  - VM with nginx and Docker installed.
  - Postgres database.
  - Vue.js, node.js, express as language stack.
  - Container-first approach for all components.

## Developmennt

Prerequisites:

- Docker
- Docker Compose
- Node.js (version in .nvmrc), recommend using a version manager like nvm or asdf
- Postman is useful for testing the api.

The application is a monorepo with two main components. The client is a Vue.js application and the API is an Express application.

### Running the application

- Copy the `.env.sample` file to `.env` and fill in the environment variables. These can also be set as environment variables on your system.
- Docker Compose:
  - To run the application in production mode, run `docker-compose up` in the root directory of the project. This will start the nginx server for the client, the express server for the API, and the Postgres database.
  - To run the application in development mode, run `docker compose -f docker-compose.dev.yml up`. This will start the client and API in development mode with hot reloading.
  - You can run `docker-compose down` to stop the application and destroy the containers and volumes.
  - Running `docker-compose up --build` will rebuild the containers and restart the application.

### Running a postgres container

The following command will run a postgres container with the password `mysecretpassword` and expose the database on port 6432.
`docker run --name some-postgres -e POSTGRES_PASSWORD=mysecretpassword -d postgres -p 6432:5432`

### Generating some test data

- run `docker compose run api node seed_dev_db.js` from the root folder of the project.

### Resources Used to Build This Application

- <https://expressjs.com/>
- <https://sequelize.org/>
  - <https://sequelize.org/docs/v6/core-concepts/model-querying-basics/#operators>
- <https://vuejs.org/>
  - <https://v2.vuejs.org/v2/cookbook>

## BRC Data End Points

- CABBI: <https://cabbitools.igb.illinois.edu/brc/cabbi.json>
- CBI: <https://fair.ornl.gov/CBI/cbi.json>
- GLBRC: <https://fair-data.glbrc.org/glbrc.json>
- JBEI: <https://hello.bioenergy.org/JBEI/jbei.json>

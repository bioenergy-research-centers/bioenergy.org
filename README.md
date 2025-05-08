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
  - Authentication and authorization within the application.
  - Admin interface.
  - Data import capabilities.
  - Access to the server to deploy outside of JBEI users.
- Tech stack
  - VM with nginx and Docker installed.
  - Postgres database.
  - Vue.js, node.js, express as language stack.
  - Container-first approach for all components.

## Development

Prerequisites:

- Docker
- Docker Compose
- Node.js (version in .nvmrc), recommend using a version manager like nvm or asdf
- Postman is useful for testing the api.

The application is a monorepo with two main components. The client is a Vue.js application and the API is an Express application.

### Running a postgres container

The following command will run a postgres container with the password `mysecretpassword` and expose the database on port 6432.

`docker run --name postgres -e POSTGRES_PASSWORD=mysecretpassword -d -p 6432:5432 postgres`

### Running the application

- Copy the `.env.sample` file to `.env` and fill in the environment variables. These can also be set as environment variables on your system.
- Docker Compose:
  - To run the application in production mode, run `docker-compose up` in the root directory of the project. This will start the nginx server for the client, the express server for the API, and the Postgres database.
  - To run the application in development mode, run `docker compose -f docker-compose.dev.yml up --build --watch`. This will start the client and API in development mode with hot reloading.
  - You can run `docker-compose down` to stop the application and destroy the containers and volumes.
  - Running `docker-compose up --build` will rebuild the containers and restart the application.

### Import BRC Data Feeds

- run `docker compose run api node scripts/import_datafeeds.js` from the root folder of the project.
- To redirect validation errors to a file, run `docker compose run api node scripts/import_datafeeds.js 2>&1 > import_datafeeds.txt`

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
- JBEI: <https://bioenergy.org/JBEI/jbei.json>

## Validating Data

Validating data against the BRC schema can be done with the LinkML framework.

This process, including installing LinkML, can be done with the validation script in this repo:

```bash
./validate.sh
```

Alternatively, the process may be done manually:

- Install the [LinkML Python package as detailed here](https://linkml.io/linkml/intro/install.html).
- Retrieve a local copy of the data collection in JSON format. For example, run `wget https://bioenergy.org/JBEI/jbei.json`
- Retrieve the most recent version of the schema in YAML format. The schema is here: <https://github.com/bioenergy-research-centers/brc-schema/blob/main/src/brc_schema/schema/brc_schema.yaml>
- Run the following `linkml` command: `linkml validate --schema brc_schema.yaml -C Dataset <datafile>`, replacing `<datafile>` with the path to your data in JSON.
  - For example, a fully valid `jbei.json` will yield the following result:
    ```
    $ linkml validate --schema brc_schema.yaml -C Dataset jbei.json
    No issues found
    ```
  - Places where the data does not comply with the schema will be indicated like below:
    ```
    $ linkml validate --schema src/brc_schema/schema/brc_schema.yaml -C Dataset jbei-bad.json 
    [ERROR] [jbei-bad.json/0] Additional properties are not allowed ('DATE' was unexpected) in /
    [ERROR] [jbei-bad.json/0] 'date' is a required property in /
    [ERROR] [jbei-bad.json/1] 'yes' is not of type 'boolean', 'null' in /creator/0/primaryContact
    [ERROR] [jbei-bad.json/8] Additional properties are not allowed ('BRC' was unexpected) in /
    [ERROR] [jbei-bad.json/8] 'brc' is a required property in /
    ```

## Copyright Notice
InterBRC Data Products Portal Copyright (c) 2025, The Regents of the University of California, through Lawrence Berkeley National Laboratory, and UT-Battelle LLC,  through Oak Ridge National Laboratory (both subject to receipt of any required approvals from the U.S. Dept. of Energy), University of Wisconsin - Madison, University of Illinois Urbana - Champaign, and Michigan State University. All rights reserved.

If you have questions about your rights to use or distribute this software,
please contact Berkeley Lab's Intellectual Property Office at
IPO@lbl.gov.

NOTICE.  This Software was developed under funding from the U.S. Department
of Energy and the U.S. Government consequently retains certain rights.  As
such, the U.S. Government has been granted for itself and others acting on
its behalf a paid-up, nonexclusive, irrevocable, worldwide license in the
Software to reproduce, distribute copies to the public, prepare derivative
works, and perform publicly and display publicly, and to permit others to do so.

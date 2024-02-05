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

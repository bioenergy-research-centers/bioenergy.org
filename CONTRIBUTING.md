# bioenergy.org contributors guidelines, version 1.0

The bioenergy.org data products portal team welcomes your contribution to the project. 
Since bioenergy.org is open source, user submissions of code, documentation, or any other kind of contribution moves the project forward. 
If you contribute code, you agree that your contribution may be incorporated into bioenergy.org and made available under the bioenergy.org license on the internet or via other applicable means.

The contribution process for bioenergy.org is composed of three steps:

## Send consent email

In order for us to distribute your code as part of bioenergy.org under the bioenergy.org license, we’ll need your consent. 
An email acknowledging understanding of these terms and agreeing to them is all that will be asked of any contributor. 
Send an email to the bioenergy.org data products portal project leads (see below for the email addresses) including the following text and a list of co-contributors (if any):

> I agree to contribute to bioenergy.org.

> I agree to the following terms and conditions for my contributions:
> First, I agree that I am licensing the copyright to my contributions under the terms of the current bioenergy.org license.
> Second, I hereby grant to The Regents of the University of California, through Lawrence Berkeley National Laboratory,
> to any successor manager and distributor of bioenergy.org appointed by the U.S. Department of Energy,
> and to all recipients of a version of bioenergy.org that includes my contributions, a non-exclusive, worldwide, royalty-free,
> irrevocable patent license under any patent claims owned by me, or owned by my employer and known to me, that are or will be,
> necessarily infringed upon by my contributions alone, or by combination of my contributions with the version of bioenergy.org
> to which they are contributed, to make, have made, use, offer to sell, sell, import, and otherwise transfer any version of bioenergy.org
> that includes my contributions, in source code and object code form. Third, I represent and warrant that I am authorized to make the contributions
> and grant the foregoing license(s). Additionally, if, to my knowledge, my employer has rights to intellectual property that covers my contributions,
> I represent and warrant that I have received permission to make these contributions and grant the foregoing license(s) on behalf of my employer.

Once we have your consent on file, you’ll only need to redo it if conditions change (e.g. a change of employer).

## Scope agreement and timeline commitment

If your contribution is small (e.g. a bug fix), simply submit your contribution via GitHub. If your contribution is larger (e.g. a new feature), 
we’ll need to evaluate your proposed contribution. To do that, we need a written description of why you wish to contribute to the bioenergy.org, 
a detailed description of the project that you are proposing, the precise functionalities that you plan to implement as part of the project, 
and a timeframe for implementation (see the template contribution proposal document). After we review your materials, 
we will schedule a meeting or conference call to discuss your information in more detail. We may ask you to revise your materials and make changes to it, 
which we will re-review. Before you do any work we must reach prior agreement and written approval on project areas, scope, timeframe, expected contents, and functionalities to be addressed.

## Technical contribution process

We want bioenergy.org to adhere to our established quality standards. As such, we ask that you follow our Agile development process - particularly with respect to coding standards, 
code review, unit tests, and code coverage. These items are explained further below. Smaller, non-code contributions may not require as much review as code contributions, 
but all contributions will be reviewed. Code contributions will initially be in a source control branch, and then will be merged into the official bioenergy.org repository 
after review and approval. Any bugs, either discovered by you, us, or any users will be tracked in our bug tracker. We request you that you take full responsibility for correcting bugs. 
Be aware that, unless notified otherwise, the correction of bugs takes precedence over the submission or creation of new code.

## Release Schedule
Contributions should be aligned with the bioenergy.org release schedule. bioenergy.org is released publicly twice each year (approximately on the last workday of March and September). 
There are cutoff dates for when new contributions are allowed for the upcoming release (approximately February 15 and August 15). If your contribution is incomplete or comes in past the cutoff date for a release, 
we reserve the right to hold your code for a later release.

## Agile Development Process
Work items are tracked and planned as Agile tasks and/or defects. You will be given user credentials to source control and Pivotal Tracker. 
Your work plan will be entered in Pivotal Tracker and tracked as Agile tasks in Pivotal. Our Agile development cycle (called iteration) is two weeks long, 
and you will be asked for progress and completion of your tasks planned for the iteration, according to the timeline for the project. 
A review of your contribution will start when the status of your Pivotal task is marked as “accept”.

## Coding Standards
We will point you to coding guidelines to help you with writing bioenergy.org code. Although these standards are not complete or very detailed, 
they should give you an idea of the style that we would like you to adopt. New additions to bioenergy.org must be written using object-oriented programming techniques and practices. 
Please also look at the bioenergy.org code itself as an example of the preferred coding style.

## Code Reviews
You will be working and testing your code in a source control branch. When a piece of functionality is complete, tested and working, let us know and we will review your code. 
If the functionality that you contributed is complex, we will ask you for a written design document as well. We want your code to follow coding standards, be clear, readable and maintainable, 
and of course it should do what it is supposed to do. We will look for errors, style issues, comments (or lack thereof), and any other issues in your code. 
We will inform you of our comments and we expect you to make the recommended changes. New re-reviews may be expected until the code complies with our required processes.

## Unit Tests
We ask that you supply unit tests along with the code that you have written. A unit test is a program that exercises your code in isolation to verify that it does what it is supposed to do. 
Your unit tests are very important to us. First, they give an indication that your code works according to its intended functionality. 
Second, we execute your unit tests automatically along with our unit tests to verify that the overall bioenergy.org code continues to work. 
You will need to write and submit Google Unit Tests (GTests) along with your code before a code review is scheduled.

## Code Coverage
We require that your unit tests provide an adequate coverage of the source code you are submitting. You will need to design your unit tests in a way that all critical parts of the code (at least) 
are tested and verified. A good rule of thumb for code coverage is 70% or greater. There are tools to help you on code coverage.

## Documentation
Proper documentation is crucial for our users, without it users will not know how to use your contribution. We require that you create user documentation so that end users know how to use your new functionality.

## For further questions or information
Please contact the bioenergy.org data products portal leads:
- Nathan Hillson njhillson@lbl.gov
- Stan Martin martins@ornl.gov
- Dirk Norman dirk.norman@wisc.edu
- Leslie Stoecker lensor@illinois.edu

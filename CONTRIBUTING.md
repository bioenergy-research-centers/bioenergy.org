# bioenergy.org contributors guidelines, version 1.1

The bioenergy.org data products portal team welcomes your contribution to the project. 
Since bioenergy.org is open source, user submissions of code, documentation, or any other kind of contribution moves the project forward. 
If you contribute code, you agree that your contribution may be incorporated into bioenergy.org and made available under the bioenergy.org license on the internet or via other applicable means.

The contribution process for bioenergy.org is composed of three steps:

## 1. Send license consent email

In order for us to distribute your code as part of bioenergy.org under the bioenergy.org license, we’ll need your consent. 
An email acknowledging understanding of these terms and agreeing to them is all that will be asked of any contributor. 
Send an email to the bioenergy.org data products portal project leads (see below for the email addresses) including the following text and a list of co-contributors (if any):


<details>

<summary>License Email Text</summary>

```
I agree to contribute to bioenergy.org.

I agree to the following terms and conditions for my contributions:
First, I agree that I am licensing the copyright to my contributions under the terms of the current bioenergy.org license.
Second, I hereby grant to The Regents of the University of California, through Lawrence Berkeley National Laboratory,
to any successor manager and distributor of bioenergy.org appointed by the U.S. Department of Energy,
and to all recipients of a version of bioenergy.org that includes my contributions, a non-exclusive, worldwide, royalty-free,
irrevocable patent license under any patent claims owned by me, or owned by my employer and known to me, that are or will be,
necessarily infringed upon by my contributions alone, or by combination of my contributions with the version of bioenergy.org
to which they are contributed, to make, have made, use, offer to sell, sell, import, and otherwise transfer any version of bioenergy.org
that includes my contributions, in source code and object code form. Third, I represent and warrant that I am authorized to make the contributions
and grant the foregoing license(s). Additionally, if, to my knowledge, my employer has rights to intellectual property that covers my contributions,
I represent and warrant that I have received permission to make these contributions and grant the foregoing license(s) on behalf of my employer.
```

</details>


Once we have your consent on file, your name will be added to `contributors.txt` and you will only need to update us if conditions change (e.g. a change of employer).

## 2. Create a Pull Request

Follow the process described in the creative-commons [PR Guidelines](https://opensource.creativecommons.org/contributing-code/pr-guidelines/) and **Assign** yourself to the related open issue(s) to share what you are working on. (Issues should already exist from agile planning and be used to track all work)

Briefly:
- **Create a branch** for your code changes. Push your branch to the repository early and often to avoid losing any work and share your progress.
- **Verify Tests Pass** locally and new contribtions have proper coverage. 
- **Open a Pull Request** from your branch against the `main` branch of bioenergy.org.
- **Describe your change** by filling out the pull request template. Make sure to reference the associated issue and fully describe the work done. The creative-commons PR guide says: "Too much detail is better than too little".

A code **Reviewer** will be assigned automatically. Verify your PR has a reviewer assigned and wait for Code Review feedback.

### General PR Guidelines
Contributors should strive for small, focused changes to expedite the review process. Unrelated features and bugfixes should be added to new pull requests. For more details, read the kubernetes community [best practices for faster reviews](https://github.com/kubernetes/community/blob/master/contributors/guide/pull-requests.md#best-practices-for-faster-reviews).


## 3. Code Review

Work with the assigned reviewer to apply recommendations and address feedback. Code Review should be a constructive process, working together to ensure a quality product that meets coding standards and project goals. 
- Read the [thoughtbot code review guide](https://github.com/thoughtbot/guides/tree/main/code-review)
- After you push updates [Re-request a review](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews#re-requesting-a-review) to inform the reviewer.
- The assigned reviewer will follow the Code Reviewer Guidelines outlined below and merge the request when all feedback is addressed.

**Note:** Any bugs, either discovered by you, us, or any users should also be tracked in Github Issues. We request that you take full responsibility for correcting bugs in your contributions. Be aware that, unless notified otherwise, the correction of bugs takes precedence over the submission or creation of new code.

## Agile Development Process
Project work items are tracked and planned using Github Issues. New issues will be continuously created over time as the project progresses. Issues will be monitored by team members and reviewed for progress during agile team meetings. New work will be continuously reviewed and merged from contributor branches into the main branch. The main branch must always be deployable. Bioenergy.org will be updated on a regular basis as requested by team leads. All final decisions on project goals and scope will be made by the data products portal team leads.

### Issue Assignment
Contributors should assign themselves to issues that are being actively worked on. If you are not able to assign yourself, please leave a comment that you are working on an issue to avoid duplicating effort.

### Code Reviewer Guidelines
Pull Request reviewers are assigned automatically using the github [CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners#about-code-owners) feature. All changes to the project must be reviewed and accepted by another team member before merging.

When assigned as a code reviewer, perform the following:
- Read the [thoughtbot code review guide](https://github.com/thoughtbot/guides/tree/main/code-review)
- verify the contributor is listed in contributors.txt.
- verify all pull request checklist items are complete and changes meet coding standards.
- verify the new functionality will work as intended and aligns with project goals.
- provide constructive feedback as needed. Strive to find [the right balance (Gitlab link)](https://docs.gitlab.com/ee/development/code_review.html#the-right-balance) in your suggestions.
- raise any concerns with team members and/or data products portal leads.

Team members eligible for Code Review will be decided by the data products portal team leads. We want the project code to follow coding standards, be clear, readable and maintainable, and of course it should do what it is supposed to do. As the reviewer, look for errors, style issues, comments, and any other potential issues. Use comments to provide feedback and recommend changes. New re-reviews may be expected until both contributor and reviewer agree the update meets expectations.

### Coding Standards

**Style:**
Contributions should follow appropriate coding style guidelines defined by the community for the relevant language or tool. Please refer to the Google styleguides for language specific references: https://google.github.io/styleguide/ Please also look at the bioenergy.org code itself as an example of the preferred coding style.

**Tests:**
Language specific testing frameworks must be utilized to verify all changes. We ask that you supply tests along with the code that you have written.
Your tests are very important to us. They give an indication that your code works according to its intended functionality and we can run them automatically to verify the overall bioenergy.org code continues to work.

**Code Coverage:**
We require that your unit tests provide an adequate coverage of the source code you are submitting. You will need to design your unit tests in a way that all critical parts of the code (at least) 
are tested and verified. A good rule of thumb for code coverage is 70% or greater.

**Documentation:**
Proper documentation is crucial for our users, without it users will not know how to use your contribution. We require that you create user documentation so that end users know how to use your new functionality. Please look at the bioenergy.org code itself for existing documentation examples.

**Comments:**
Proper documentation is also crucial for developers. Document the code itself thoroughly with comments following appropriate community style guides.

## For further questions or information
Please contact the bioenergy.org data products portal leads:
- Nathan Hillson njhillson@lbl.gov
- Stan Martin martins@ornl.gov
- Dirk Norman dirk.norman@wisc.edu
- Leslie Stoecker lensor@illinois.edu

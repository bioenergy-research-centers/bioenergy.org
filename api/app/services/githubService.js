
// Finds or creates an issue using provided 'title', 'label', and 'state' arguments.
// Then, compares provided 'formattedBody' against issue description and latest comment.
// If neither match, creates a new comment with new 'formattedBody'.

async function syncIssueComment(rawTitle, formattedBody, {state="open", labels='sync', maxIssueLimit=200, maxCommentLimit=100} = {}) {
  title = rawTitle.substring(0,256);
  // Search expects single comma separated label string, while create expects array of labels, so we need both.
  labels_arr = labels.split(",").map(item => item.trim());
  console.log("checking issue:", title, state, labels, labels_arr);
  try {  
    // dynamic import of ES module inside commonJS
    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({ auth: process.env.GITHUB_INBOX_REPO_TOKEN });
    const serviceEnabled = process.env.GITHUB_SERVICE_ENABLED==='true';
    const serviceWriteEnabled = process.env.GITHUB_SERVICE_WRITE_ENABLED==='true';
    if(!serviceEnabled) {
      console.log(`Github Service not enabled. Skipping new issue for: ${title}`);
      return false;
    }

    // Fetch all open issues matching supplied labels and state
    const issues = await octokit.paginate(
      octokit.issues.listForRepo,
      {
        owner: process.env.GITHUB_INBOX_REPO_OWNER,
        repo: process.env.GITHUB_INBOX_REPO,
        labels: labels,
        state: state,
        per_page: 100, // max allowed page size
      }
    );

    // short circuit issue sync if max limit reached for this label. Avoid flooding repo by mistake.
    if (issues.length >= maxIssueLimit){
      console.error(`Error syncing issue: ${title}`, `Maximum isssue limit reached (${issues.length})`);
      return false;
    }

    const existingIssue = issues.find(issue => issue.title === title);

    if (existingIssue) {
      // Get comments
      const { data: comments } = await octokit.issues.listComments({
        owner: process.env.GITHUB_INBOX_REPO_OWNER,
        repo: process.env.GITHUB_INBOX_REPO,
        issue_number: existingIssue.number,
        per_page: 100,
      });
      // short circuit issue sync if comment limit reached. Avoid flooding issue comments by mistake.
      if(comments.length >= maxCommentLimit){
        console.error(`Error syncing issue: ${title}`, `Maximum comment limit reached (${comments.length})`);
        return false;
      }
      // Compare latest comment
      if(comments.length > 0){
        const latestComment = comments[comments.length - 1];
        if (latestComment && latestComment.body.trim() === formattedBody.trim()) {
          console.log(`No update needed for last comment: ${title}`);
          return true;
        }
      }
      // Compare original issue
      if (existingIssue.body.trim() === formattedBody.trim()) {
        console.log(`No update needed for: ${title}`);
      } else {
        // Add new comment for changes
        if(serviceWriteEnabled){
          await octokit.issues.createComment({
            owner: process.env.GITHUB_INBOX_REPO_OWNER,
            repo: process.env.GITHUB_INBOX_REPO,
            issue_number: existingIssue.number,
            body: formattedBody,
          });
          console.log(`Updated issue comment for: ${title}`);
          return true;
        } else {
          console.log(`Write disabled. Skipping issue comment for: ${title}`);
          return false;
        }
        
      }
    } else {
      // Create new issue
      if(serviceWriteEnabled){
        await octokit.issues.create({
          owner: process.env.GITHUB_INBOX_REPO_OWNER,
          repo: process.env.GITHUB_INBOX_REPO,
          title: title,
          body: formattedBody,
          labels: labels_arr,
        });
        console.log(`Created new issue for: ${title}`);
        return true;
      } else {
        console.log(`Write disabled. Skipping new issue for: ${title}`);
        return false;
      }
    }
  } catch (error) {
    console.error(`Error syncing issue: ${title}`, error.message);
    return false;
  }
}

module.exports = { syncIssueComment };
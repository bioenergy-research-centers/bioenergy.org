const sanitizeHtml = require('sanitize-html');

// Format contact form data as a set of list items
function formatContactForm(data, maxLength=10000) {
  return `### Contact Information

**Name:** ${sanitizeHtml(data.contact_name)}  
**Email:** ${sanitizeHtml(data.contact_email)}  
**Affiliation:** ${sanitizeHtml(data.contact_affiliation)}

### Reason for Contact
${sanitizeHtml(data.contact_reason)}

### Message

\`\`\`
${sanitizeHtml(data.contact_comment.substring(0,maxLength)).replaceAll('```','')}
\`\`\`

`;
}

// Format Array of identifiers as a Markdown unordered list with sub-bullets.
// Each identifier is an Array: [list, sublist block].
function formatListWithSublistBlocks(identifiers, blockformat='') {
  const maxItems = 100;
  let text = '';
  let sanitizedIdentifiers = identifiers;
  if (identifiers.length > maxItems) {
    text += `Output truncated to ${maxItems} items from total length: ${identifiers.length}\n\n`;
    sanitizedIdentifiers = identifiers.slice(0,maxItems);
  };
  text += sanitizedIdentifiers
    .map(
      (d) => `- ${d[0]}\n  \`\`\`${blockformat}\n  ${d[1]}\n  \`\`\``
    )
    .join("\n");
  return text;
}
// Format Array of strings as a Markdown unordered list
function formatList(identifiers) {
  return identifiers.map(id => `- ${id}`).join("\n");
}

module.exports = {
  formatContactForm,
  formatListWithSublistBlocks,
  formatList
};
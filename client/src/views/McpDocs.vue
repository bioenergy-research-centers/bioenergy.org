<script setup lang="ts">
  import {ref, watch} from "vue";
  import {useRoute, useRouter} from "vue-router";
  import HeaderView from "@/views/HeaderView.vue";
  import {BTab, BTabs} from "bootstrap-vue-next";
  
  const docsLink = import.meta.env.VITE_BIOENERGY_ORG_API_URI + '/api-docs';

  const route = useRoute();
  const router = useRouter();

  const slugToTab: Record<string, string> = {
    'getting-started': 'getting-started-tab',
    'using-mcp-server': 'using-mcp-server-tab',
  };

  const tabToSlug: Record<string, string> = {
    'getting-started-tab': 'getting-started',
    'using-mcp-server-tab': 'using-mcp-server',
  };

  // Reads the tab query parameter, maps it to a tab ID, and falls back to Getting Started
  const tabFromUrl = () => {
    const slug = typeof route.query.tab === 'string'
      ? route.query.tab
      : 'getting-started';

    return slugToTab[slug] ?? 'getting-started-tab';
  };

  const activeTab = ref(tabFromUrl());

  watch(
    () => route.query.tab,
    () => {
      activeTab.value = tabFromUrl();
    },
  );

  // Convert tab's internal ID to query parameter, preserves other query parameters, and clears URL hash
  const updateTabUrl = (tabId: string) => {
    void router.replace({
      query: {
        ...route.query,
        tab: tabToSlug[tabId] ?? 'getting-started',
      },
      hash: '',
    });
  };
</script>

<template>
  <HeaderView />
  <main id="main-content" class="scroll-offset">
    <div class="container">
      <div class="row">
        <div class="col-12 mt-4">
          <BTabs
            v-model="activeTab"
            @update:model-value="updateTabUrl"
          >
            <BTab
              id="getting-started-tab"
              button-id="getting-started-tab-button"
              title="Getting Started"
            >
              <div class="border border-top-0 bg-white p-4">
                <h2 id="getting-started">Getting Started with the MCP Server</h2>

                <section class="mt-4 pb-4 border-bottom">
                  <p>The bioenergy.org MCP (Model Context Protocol) server allows AI assistants to search the bioenergy.org dataset catalog directly without requiring custom integrations or downloading the dataset index.</p>

                  <p>The public MCP endpoint is:</p>

                  <p class="bg-light border rounded p-3">
                    <code>https://mcp.bioenergy.org/mcp</code>
                  </p>
                </section>
                
                <section class="mt-4 pb-4 border-bottom">
                  <h3 id="connecting-in-under-two-minutes">Connecting in Under Two Minutes</h3>
                  
                  <p>Most MCP-compatible applications require only the MCP server URL.</p>
                  
                  <pre class="bg-light border rounded p-3"><code>Server Name: bioenergy.org
Transport: Streamable HTTP
URL: https://mcp.bioenergy.org/mcp</code></pre>

                  <p>Once connected, your AI assistant will automatically discover the available dataset search tools.</p>
                </section>
                
                <section class="mt-4 pb-4 border-bottom">
                  <h3 id="example-claude-desktop">Example: Claude Desktop</h3>
                  
                  <p>Open the MCP configuration in Claude Desktop and add a new remote MCP server.</p>
                  
                  <pre class="bg-light border rounded p-3"><code>Name: bioenergy.org
Transport: Streamable HTTP
URL: https://mcp.bioenergy.org/mcp</code></pre>
                  
                  <p>Restart Claude Desktop.</p>
                  
                  <p>The bioenergy.org tools should now appear automatically.</p>
                </section>
                
                <section class="mt-4 pb-4 border-bottom">
                  <h3 id="example-claude-code">Example: Claude Code</h3>
                  
                  <p>Claude Code supports remote MCP servers. See the <a href="https://code.claude.com/docs/en/mcp-quickstart">Claude Code MCP quickstart</a> for additional configuration options. </p>

                  <pre class="bg-light border rounded p-3"><code>claude mcp add --transport http bioenergy https://mcp.bioenergy.org/mcp</code></pre>
                  
                  <p>Claude Code can search the bioenergy.org dataset catalog directly during coding or research workflows.</p>
                  
                  <p class="fw-bold">Example:</p>
                  <p class="bg-light border rounded p-3">
                    <code>Find all transcriptomics datasets related to ethanol published after January 2025.</code>
                  </p>
                </section>
                
                <section class="mt-4 pb-4 border-bottom">
                  <h3 id="example-codex-cli">Example: Codex CLI</h3>
                  
                   <p>See the <a href="https://developers.openai.com/codex/mcp">Codex MCP documentation</a>
                    for additional configuration options.
                  </p>

                  <pre class="bg-light border rounded p-3"><code>codex mcp add bioenergy --url https://mcp.bioenergy.org/mcp</code></pre>
                  
                </section>

                <section class="mt-4 pb-4 border-bottom">
                  <h3 id="example-cursor">Example: Cursor</h3>
                  
                  <p>Cursor supports connecting to remote MCP servers.</p>
                  
                  <p>Add a new MCP server using:</p>
                  
                  <p class="bg-light border rounded p-3">
                    <code>https://mcp.bioenergy.org/mcp</code>
                  </p>
                  
                  <p>Once connected, Cursor can search datasets while assisting with code, data analysis, or scientific workflows.</p>
                </section>
                
                <section class="mt-4 pb-4 border-bottom">
                  <h3 id="example-running-a-local-model">Example: Running a Local Model</h3>
                  
                  <p>Many researchers run local language models using tools such as:</p>
                  
                  <ul>
                    <li>Ollama</li>
                    <li>LM Studio</li>
                    <li>llama.cpp</li>
                    <li>Open WebUI</li>
                    <li>Jan</li>
                  </ul>
                  
                  <p>These models can be connected to the bioenergy.org MCP server to perform live dataset searches without storing the catalog locally.</p>
                  
                  <p>Example workflow:</p>
                  
                  <pre class="bg-light border rounded p-3"><code>User
↓
Local LLM
↓
bioenergy.org MCP Server
↓
bioenergy.org Dataset API</code></pre>
                              
                  <p>This allows lightweight local models to access the complete public dataset catalog.</p>
                </section>
                
                <section class="mt-4 pb-4 border-bottom">
                  <h3 id="example-agent-frameworks">Example: Agent Frameworks</h3>
                  
                  <p>The MCP server can also be used from AI coding assistants and agent frameworks, including:</p>
                  
                  <ul>
                    <li>Claude Code</li>
                    <li>OpenAI Codex CLI</li>
                    <li>Gemini CLI</li>
                    <li>Continue</li>
                    <li>Aider</li>
                    <li>OpenCode</li>
                    <li>Custom MCP-compatible agents</li>
                  </ul>
                  
                  <p>No custom bioenergy.org client library is required.</p>            
                </section>
                
                <section class="mt-4 pb-4 border-bottom">
                  <h3 id="getting-started-example-prompts">Example Prompts</h3>
                  
                  <p class="fw-bold">Basic Search</p>
                  <p class="bg-light border rounded p-3">
                    <code>Find datasets related to lignin biosynthesis.</code>
                  </p>
                  
                  <p class="fw-bold">Search by Bioenergy Research Center</p>
                  <p class="bg-light border rounded p-3">
                    <code>Show me GLBRC transcriptomics datasets.</code>
                  </p>

                  <p class="fw-bold">Search by Publication Date</p>
                  <p class="bg-light border rounded p-3">
                    <code>Find datasets published after January 1, 2025.</code>
                  </p>

                  <p class="fw-bold">Combine Filters</p>
                  <p class="bg-light border rounded p-3">
                    <code>Find CABBI metabolomics datasets related to sorghum published during 2024.</code>
                  </p>

                  <p class="fw-bold">Continue Browsing</p>
                  <p class="bg-light border rounded p-3">
                    <code>Show me the next page.</code>
                  </p>

                  <p class="fw-bold">Retrieve a Dataset</p>
                  <p class="bg-light border rounded p-3">
                    <code>Open dataset JBEI_https://doi.org/10.1016/j.jil.2025.100184.</code>
                  </p>
                </section>
                
                <section class="mt-4 pb-4 border-bottom">
                  <h3 id="available-mcp-tools">Available MCP Tools</h3>
                  
                  <p>The server currently exposes the following tools:</p>
                  
                  <ul>
                    <li><code>search_datasets</code></li>
                    <li><code>list_datasets</code></li>
                    <li><code>get_dataset</code></li>
                    <li><code>next_dataset_page</code></li>
                    <li><code>previous_dataset_page</code></li>
                    <li><code>current_dataset_page</code></li>
                  </ul>
                  
                  <p>Most users will primarily use <code>search_datasets</code>. The pagination tools allow AI assistants to continue browsing large result sets without repeating the original search.</p>
                </section>
                
                <section class="mt-4 pb-4">
                  <h3 id="need-more-information">Need More Information?</h3>
                  
                  <p>For a complete description of the MCP server, available search filters, API behavior, and supported workflows, see the <a href="mcp-docs?tab=using-mcp-server">Using the MCP Server documentation</a>.</p>
                </section>
              </div>
            </BTab>

            <BTab
              id="using-mcp-server-tab"
              button-id="using-mcp-server-tab-button"
              title="Using the MCP Server"
            >
              <div class="border border-top-0 rounded bg-white p-4">
                <h2 id="using-the-mcp-server">Using the MCP Server</h2>
                
                <section class="mt-4 pb-4 border-bottom">
                 
                  <p>The bioenergy.org MCP (Model Context Protocol) server allows AI assistants and agent frameworks to search the bioenergy.org dataset catalog directly without requiring custom integrations or local copies of the dataset index.</p>

                  <p>The server exposes the public bioenergy.org search API as a set of MCP tools that can be used by local language models, hosted AI assistants, and agent frameworks supporting the Model Context Protocol.</p>

                  <h3>MCP Endpoint</h3>

                  <p><code>https://mcp.bioenergy.org/mcp</code></p>

                  <h3>Health check:</h3>

                  <p><code>https://mcp.bioenergy.org/health</code></p>
                </section>
                
                <section class="mt-4 pb-4 border-bottom">
                  <h2 id="available-tools">Available Tools</h2>

                  <div class="table-responsive">
                    <table class="table table-striped table-hover align-middle">
                      <thead class="table-light">
                        <tr>
                          <th scope="col">Tool</th>
                          <th scope="col">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <th scope="row"><code>search_datasets</code></th>
                          <td>Search datasets using free-text and metadata filters.</td>
                        </tr>
                        <tr>
                          <th scope="row"><code>list_datasets</code></th>
                          <td>Browse the dataset catalog page by page.</td>
                        </tr>
                        <tr>
                          <th scope="row"><code>next_dataset_page</code></th>
                          <td>Retrieve the next page from the previous search.</td>
                        </tr>
                        <tr>
                          <th scope="row"><code>previous_dataset_page</code></th>
                          <td>Retrieve the previous page from the current search.</td>
                        </tr>
                        <tr>
                          <th scope="row"><code>current_dataset_page</code></th>
                          <td>Redisplay the current search page.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
                
                <section class="mt-4 pb-4 border-bottom">
                  <h2 id="supported-search-parameters">Supported Search Parameters</h2>

                  <p>The <code>search_datasets</code> tool supports:</p>

                  <div class="table-responsive">
                    <table class="table table-striped table-hover align-middle">
                      <thead class="table-light">
                        <tr>
                          <th scope="col">Parameter</th>
                          <th scope="col">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <th scope="row"><code>q</code></th>
                          <td>Free-text search query.</td>
                        </tr>
                        <tr>
                          <th scope="row"><code>page</code></th>
                          <td>Page number, using a 1-based index.</td>
                        </tr>
                        <tr>
                          <th scope="row"><code>rows</code></th>
                          <td>Results per page.</td>
                        </tr>
                        <tr>
                          <th scope="row"><code>analysisType</code></th>
                          <td>Filter by analysis type.</td>
                        </tr>
                        <tr>
                          <th scope="row"><code>brc</code></th>
                          <td>Filter by one or more Bioenergy Research Centers.</td>
                        </tr>
                        <tr>
                          <th scope="row"><code>from_date</code></th>
                          <td>Publication date lower bound in <code>YYYY-MM-DD</code> format.</td>
                        </tr>
                        <tr>
                          <th scope="row"><code>until_date</code></th>
                          <td>Publication date upper bound in <code>YYYY-MM-DD</code> format.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p>Supported Bioenergy Research Centers include:</p>

                  <ul class="list-inline">
                    <li class="list-inline-item"><span class="badge bg-brc-light-blue text-dark">JBEI</span></li>
                    <li class="list-inline-item"><span class="badge bg-brc-light-blue text-dark">CABBI</span></li>
                    <li class="list-inline-item"><span class="badge bg-brc-light-blue text-dark">CBI</span></li>
                    <li class="list-inline-item"><span class="badge bg-brc-light-blue text-dark">GLBRC</span></li>
                  </ul>
                </section>
                
                <section class="mt-4 pb-4 border-bottom">
                  <h2 id="pagination">Pagination</h2>
                  
                  <p>The MCP server maintains search state for each MCP session.</p>
                  
                  <p>After running either <code>search_datasets</code> or <code>list_datasets</code>, an AI assistant may simply request:</p>
                  
                  <ul>
                    <li>"Show me the next page."</li>
                    <li>"Go back one page."</li>
                    <li>"Show the current page again."</li>
                  </ul>
                  
                  <p>The assistant does not need to resend the original search query or filters. Pagination state is isolated to each MCP session.</p>
                  
                </section>
                
                <section class="mt-4 pb-4 border-bottom">
                  <h2 id="example-use-cases">Example Use Cases</h2>

                  <section class="mt-3">
                    <h4 id="running-local-models">Running Local Models</h4>

                    <p>The MCP server works well with local language models running through tools such as:</p>

                    <ul>
                      <li>Ollama</li>
                      <li>LM Studio</li>
                      <li>llama.cpp</li>
                      <li>Jan</li>
                      <li>Open WebUI</li>
                    </ul>

                    <p class="fw-bold">Example:</p>
                    <p class="bg-light border rounded p-3">
                      <code>Search for recent ethanol transcriptomics datasets published after January 2025.</code>
                    </p>

                    <p>Instead of embedding the dataset catalog inside the model, the model queries the MCP server in real time.</p>
                  </section>

                  <section class="mt-4 pb-4 border-bottom">
                    <h4 id="connecting-hosted-ai-assistants">Connecting Hosted AI Assistants</h4>

                    <p>Many hosted AI platforms now support MCP servers.</p>

                    <p>Examples include:</p>

                    <ul>
                      <li>Claude Desktop</li>
                      <li>Claude Code</li>
                      <li>Cursor</li>
                      <li>Continue</li>
                      <li>VS Code AI extensions</li>
                      <li>Other MCP-compatible assistants</li>
                    </ul>

                    <p>Once configured, the assistant can search bioenergy.org datasets as part of normal conversations.</p>
                  </section>

                  <section class="mt-4">
                    <h2 id="agent-frameworks">Agent Frameworks</h2>

                    <p>The MCP server can also be used from agent frameworks and coding assistants, including:</p>

                    <ul>
                      <li>OpenAI Codex CLI</li>
                      <li>Claude Code</li>
                      <li>Gemini CLI</li>
                      <li>Continue</li>
                      <li>Aider</li>
                      <li>OpenCode</li>
                      <li>Custom MCP-compatible agents</li>
                    </ul>

                    <p>This allows AI workflows to incorporate bioenergy.org searches without implementing custom API clients.</p>
                  </section>
                  
                </section>
                
                <section class="mt-4 pb-4 border-bottom">
                  <h2 id="using-mcp-example-prompts">Example Prompts</h2>

                  <p class="fw-bold">General search:</p>
                  <p class="bg-light border rounded p-3">
                    <code>Find datasets related to ethanol production.</code>
                  </p>

                  <p class="fw-bold">Publication date filtering:</p>
                  <p class="bg-light border rounded p-3">
                    <code>Find datasets published after January 1, 2025 related to lignin.</code>
                  </p>

                  <p class="fw-bold">BRC filtering:</p>
                  <p class="bg-light border rounded p-3">
                    <code>Show me GLBRC transcriptomics datasets.</code>
                  </p>

                  <p class="fw-bold">Analysis type:</p>
                  <p class="bg-light border rounded p-3">
                    <code>Find shotgun proteomics datasets involving switchgrass.</code>
                  </p>

                  <p class="fw-bold">Combined query:</p>
                  <p class="bg-light border rounded p-3">
                    <code>Find CABBI metabolomics datasets published during 2024 related to sorghum.</code>
                  </p>

                  <p class="fw-bold">Pagination:</p>
                  <p class="bg-light border rounded p-3">
                    <code>Show me the next page.</code>
                  </p>
                  <p class="bg-light border rounded p-3">
                    <code>Continue browsing these results.</code>
                  </p>
                  <p class="bg-light border rounded p-3">
                    <code>Go back one page.</code>
                  </p>

                  <p class="fw-bold">Dataset lookup:</p>
                  <p class="bg-light border rounded p-3">
                    <code>Retrieve dataset JBEI_https://doi.org/10.1016/j.jil.2025.100184.</code>
                  </p>
                </section>
                
                <section class="mt-4 pb-4 border-bottom">
                  <h2 id="example-workflow">Example Workflow</h2>

                  <p class="fw-bold">Search for datasets:</p>
                  <p class="bg-light border rounded p-3">
                    <code>Find transcriptomics datasets related to ethanol.</code>
                  </p>

                  <p>Review the returned datasets.</p>

                  <p class="fw-bold">Continue browsing:</p>
                  <p class="bg-light border rounded p-3">
                    <code>Show me the next page.</code>
                  </p>

                  <p class="fw-bold">Retrieve a specific dataset:</p>
                  <p class="bg-light border rounded p-3">
                    <code>Open dataset JBEI_https://doi.org/10.1016/j.jil.2025.100184.</code>
                  </p>

                </section>
                
                <section class="mt-4 pb-4 border-bottom">
                  <h2 id="benefits">Benefits</h2>

                  <p>Using the MCP server allows AI assistants to:</p>

                  <ul>
                    <li>Search the current bioenergy.org catalog without maintaining local indexes.</li>
                    <li>Retrieve datasets using structured metadata filters.</li>
                    <li>Navigate large result sets using session-aware pagination.</li>
                    <li>Access the latest published datasets without retraining or rebuilding local models.</li>
                  </ul>
                </section>

                <section class="mt-4 pb-4 border-bottom">
                  <h2 id="privacy">Privacy</h2>

                  <p>The MCP server provides access only to publicly available bioenergy.org dataset metadata.</p>

                  <p>Searches are performed in real time against the bioenergy.org API. No local copy of the dataset catalog is required.</p>

                  <p>The current public MCP server does not require authentication.</p>
                </section>

                <section class="mt-4 pb-4">
                  <h2 id="additional-information">Additional Information</h2>

                  <p>The MCP server is a lightweight adapter over the bioenergy.org REST API. All dataset metadata, filtering, pagination, and validation are performed by the underlying API.</p>

                  <p>For developers interested in integrating directly with the REST API, see the bioenergy.org <a :href="docsLink">API documentation and OpenAPI (Swagger) interface</a>.</p>
                </section>
              </div>
            </BTab>
          </BTabs>
        </div>
      </div>
    </div>
  </main>

</template>

<style scoped>
code {
  color: #cc2c7c;
}

pre code {
  color: #cc2c7c;
}
</style>

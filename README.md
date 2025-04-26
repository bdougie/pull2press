# Pull2Press

Pull2Press is a tool that converts GitHub pull requests into publishable content. It leverages the GitHub API to fetch pull request data and uses OpenAI's API to transform technical changes into readable, structured content.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/yourusername/pull2press)

## Features

- GitHub pull request fetching and analysis
- AI-powered content generation from code changes
- Customizable output formats
- Easy-to-use web interface

## Prerequisites

- Node.js (v16 or higher)
- npm
- GitHub account with personal access token
- OpenAI API key

## Local Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/pull2press.git
   cd pull2press
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   GITHUB_TOKEN=your_github_personal_access_token
   OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

Pull2Press uses Vitest for testing. You can run tests using the following npm scripts:

1. Run all tests once:
   ```bash
   npm test
   ```

2. Run tests in watch mode (for development):
   ```bash
   npm run test:watch
   ```

3. Run tests with UI:
   ```bash
   npm run test:ui
   ```

4. Generate test coverage report:
   ```bash
   npm run coverage
   ```

## How It Works

### GitHub API Integration

Pull2Press uses the GitHub REST API to:

1. Authenticate using your personal access token
2. Fetch pull request details including:
   - Title, description, and author
   - Files changed
   - Commit messages
   - Code diffs

The fetching process follows these steps:

- Initialize the Octokit client with your GitHub token
- Request pull request data using the repository owner, repo name, and PR number
- Process the response to extract relevant information
- Store the structured data for further processing

Example of GitHub API fetch operation:

```javascript
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const { data: pullRequest } = await octokit.rest.pulls.get({
  owner,
  repo,
  pull_number: prNumber,
});

const { data: pullRequestFiles } = await octokit.rest.pulls.listFiles({
  owner,
  repo,
  pull_number: prNumber,
});
```

### OpenAI Integration

Pull2Press leverages OpenAI's API to:

1. Analyze the content of the pull request
2. Generate human-readable summaries of code changes
3. Create structured content based on the technical changes

The OpenAI processing pipeline:

- Prepare a prompt containing pull request metadata and code diffs
- Send the prompt to OpenAI's API with specific parameters (model, temperature, etc.)
- Process the response to generate the final content
- Format the content according to user preferences

Example of OpenAI API interaction:

```javascript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ],
  temperature: 0.7,
});

const generatedContent = response.choices[0].message.content;
```

### Local LLM Integration with Ollama

Pull2Press supports local Large Language Models through Ollama for development and testing:

1. When running in development mode, the application will attempt to use Ollama first
2. If Ollama is not available, it falls back to OpenAI
3. In production environments, OpenAI is used by default

The Ollama processing pipeline:

- Check if Ollama is available at the specified endpoint
- Use the same prompt structure as the OpenAI implementation
- Send requests to the local Ollama server
- Process and format the response the same way as with OpenAI

Example of Ollama API interaction:

```javascript
const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: DEFAULT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    options: {
      temperature: 0.7,
    },
    stream: false,
  }),
});
```

### Shared Prompt Utilities

To maintain consistency and avoid duplication, Pull2Press uses shared prompt utilities:

- Common data structures and interfaces are defined in a central location
- System prompts are standardized for all LLM providers
- User prompt construction follows a consistent template

Example of shared prompt utilities:

```typescript
// Shared system prompt
export const getSystemPrompt = (): string => {
  return `You are an expert technical writer and software engineer...`;
};

// Shared user prompt builder
export const buildUserPrompt = (prData: PullRequestData): string => {
  return `Write a detailed technical blog post about...`;
};
```

## Usage

1. Navigate to the web interface
2. Enter the GitHub repository owner, name, and pull request number
3. Select your desired output format
4. Click "Generate" to create your content
5. Review, edit, and download the generated content

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.

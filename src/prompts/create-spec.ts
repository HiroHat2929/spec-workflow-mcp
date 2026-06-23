import { Prompt, PromptMessage } from '@modelcontextprotocol/sdk/types.js';
import { PromptDefinition } from './types.js';
import { ToolContext } from '../types.js';

const prompt: Prompt = {
  name: 'create-spec',
  title: 'Create Specification Document',
  description: 'Guide for creating spec documents directly in the file system. Shows how to use templates and create requirements, design, or tasks documents at the correct paths.',
  arguments: [
    {
      name: 'specName',
      description: 'Feature name in kebab-case (e.g., user-authentication, data-export)',
      required: true
    },
    {
      name: 'documentType', 
      description: 'Type of document to create: requirements, design, or tasks',
      required: true
    },
    {
      name: 'description',
      description: 'Brief description of what this spec should accomplish',
      required: false
    }
  ]
};

async function handler(args: Record<string, any>, context: ToolContext): Promise<PromptMessage[]> {
  const { specName, documentType, description } = args;
  
  if (!specName || !documentType) {
    throw new Error('specName and documentType are required arguments');
  }

  const validDocTypes = ['requirements', 'design', 'tasks'];
  if (!validDocTypes.includes(documentType)) {
    throw new Error(`documentType must be one of: ${validDocTypes.join(', ')}`);
  }

  // Build context-aware messages
  const messages: PromptMessage[] = [
    {
      role: 'user',
      content: {
        type: 'text',
        text: `Create a ${documentType} document for the "${specName}" feature using the spec-workflow methodology.

**Context:**
- Project: ${context.projectPath}
- Feature: ${specName}
- Document type: ${documentType}
${description ? `- Description: ${description}` : ''}
${context.dashboardUrl ? `- Dashboard: ${context.dashboardUrl}` : ''}

**Instructions:**
1. First, read the template at: .spec-workflow/templates/${documentType}-template.md
2. Follow the template structure exactly - this ensures consistency across the project
3. Create comprehensive content that follows spec-driven development best practices
4. Include all required sections from the template
5. Use clear, actionable language
6. Create the document at: .spec-workflow/specs/${specName}/${documentType}.md
7. After creating, use approvals tool with action:'request' to get user approval

**File Paths:**
- Template location: .spec-workflow/templates/${documentType}-template.md
- Document destination: .spec-workflow/specs/${specName}/${documentType}.md

**Workflow Guidelines:**
- Requirements documents define WHAT needs to be built
- Design documents define HOW it will be built  
- Tasks documents break down implementation into actionable steps
- Each document builds upon the previous one in sequence
- Templates are automatically updated on server start

${documentType === 'requirements' ? `
**Special Instructions for Requirements Document (IPA-aligned Discovery):**
- BEFORE writing requirements.md, you MUST run the 2-step Discovery flow defined in spec-workflow-guide (Phase 1, step 3).
- Step 1: ask Q1〜Q5 (concept questions) ONE AT A TIME and wait for the user's answer between questions.
  - After Q4, run a web search for market/industry/regulatory trends and present a summary.
  - At Q5, propose 3〜5 candidate KGI/KPI based on Q1〜Q4.
  - After Q5, run a web search for similar products / case studies and present 2〜3 examples.
- Step 2: summarize Q1〜Q5 + research findings as a markdown table and confirm with the user. Loop until the user agrees.
- Step 3: ask Q6〜Q8 (stakeholders / scope / constraints) ONE AT A TIME.
- Use the user's language (default 日本語). Be conversational, colleague-tone.
- Only AFTER all 8 answers + Step 2 confirmation are recorded, draft requirements.md based on Q1〜Q8 + the requirements template.
- Map each requirement back to which Q it derives from when natural.
` : ''}

${documentType === 'tasks' ? `
**Special Instructions for Tasks Document:**
- For each task, generate a _Prompt field with structured AI guidance
- Format: _Prompt: Role: [role] | Task: [description] | Restrictions: [constraints] | Success: [criteria]
- Make prompts specific to the project context and requirements
- Include _Leverage fields pointing to existing code to reuse
- Include _Requirements fields showing which requirements each task implements
- Tasks should be atomic (1-3 files each) and in logical order

**Implementation Logging:**
- When implementing tasks, developers will use the log-implementation tool to record what was done
- Implementation logs appear in the dashboard's "Logs" tab for easy reference
- These logs prevent implementation details from being lost in chat history
- Good task descriptions help developers write better implementation summaries
` : ''}

Please read the ${documentType} template and create the comprehensive document at the specified path.`
      }
    }
  ];

  return messages;
}

export const createSpecPrompt: PromptDefinition = {
  prompt,
  handler
};
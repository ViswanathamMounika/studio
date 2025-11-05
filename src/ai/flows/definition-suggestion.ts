
'use server';

/**
 * @fileOverview An AI agent that suggests related definitions based on keywords and content.
 *
 * - suggestDefinitions - A function that suggests definitions related to a given definition.
 * - SuggestDefinitionsInput - The input type for the suggestDefinitions function.
 * - SuggestDefinitionsOutput - The return type for the suggestDefinitions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestDefinitionsInputSchema = z.object({
  currentDefinitionName: z.string().describe('The name of the current definition.'),
  currentDefinitionDescription: z.string().describe('The description of the current definition.'),
  keywords: z.array(z.string()).describe('Keywords associated with the current definition.'),
});
export type SuggestDefinitionsInput = z.infer<typeof SuggestDefinitionsInputSchema>;

const SuggestDefinitionsOutputSchema = z.object({
  suggestedDefinitions: z.array(z.string()).describe('A list of suggested definition names.'),
});
export type SuggestDefinitionsOutput = z.infer<typeof SuggestDefinitionsOutputSchema>;

export async function suggestDefinitions(input: SuggestDefinitionsInput): Promise<SuggestDefinitionsOutput> {
  return suggestDefinitionsFlow(input);
}

const getDefinitions = ai.defineTool(
  {
    name: 'getDefinitions',
    description: 'Returns a list of definition names based on keywords and description.',
    inputSchema: z.object({
      keywords: z.array(z.string()).describe('Keywords to search for.'),
      description: z.string().describe('Description to search for similar definitions.'),
    }),
    outputSchema: z.array(z.string()).describe('A list of definition names.'),
  },
  async (input) => {
    // This is a placeholder, returning existing definition names
    console.log('getDefinitions tool called with:', input);
    // Return names that are guaranteed to exist in initialDefinitions
    return ['Service Type Mapping', 'Authorization Timeliness', 'Contracted Rates', 'Claim Adjudication Status'];
  }
);

const prompt = ai.definePrompt({
  name: 'suggestDefinitionsPrompt',
  tools: [getDefinitions],
  input: {schema: SuggestDefinitionsInputSchema},
  output: {schema: SuggestDefinitionsOutputSchema},
  prompt: `You are an expert in US Healthcare Medpoint Management definitions.

  Based on the current definition's keywords and description, suggest other definitions that might be relevant.
  Use the getDefinitions tool to find definitions.

Current Definition Name: {{{currentDefinitionName}}}
Current Definition Description: {{{currentDefinitionDescription}}}
Keywords: {{#each keywords}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Suggest definitions related to the current definition:
`,
});

const suggestDefinitionsFlow = ai.defineFlow(
  {
    name: 'suggestDefinitionsFlow',
    inputSchema: SuggestDefinitionsInputSchema,
    outputSchema: SuggestDefinitionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (output) {
      return output;
    }
    // Provide a fallback with valid data
    return {
        suggestedDefinitions: ['Service Type Mapping', 'Authorization Timeliness', 'Contracted Rates', 'Claim Adjudication Status']
    };
  }
);

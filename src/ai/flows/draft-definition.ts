
'use server';

/**
 * @fileOverview An AI agent that drafts a definition from a SQL query.
 *
 * - draftDefinition - A function that takes a SQL query and returns a drafted definition.
 * - DraftDefinitionInput - The input type for the draftDefinition function.
 * - DraftDefinitionOutput - The return type for the draftDefinition function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const DraftDefinitionInputSchema = z.object({
  query: z.string().describe('The SQL query to analyze.'),
});
export type DraftDefinitionInput = z.infer<typeof DraftDefinitionInputSchema>;

export const DraftDefinitionOutputSchema = z.object({
  name: z.string().describe('A descriptive, human-readable name for the definition based on the SQL query. For example, "Approved Authorization Decision Dates".'),
  description: z.string().describe('A detailed HTML-formatted description of what the query does, explaining its purpose, logic, and any important columns or joins. Use headings (<h3>) and lists (<ul><li>) for clarity.'),
  keywords: z.array(z.string()).describe('A list of relevant keywords or tags based on the query, such as table names, key columns, or business concepts.'),
});
export type DraftDefinitionOutput = z.infer<typeof DraftDefinitionOutputSchema>;

const prompt = ai.definePrompt({
  name: 'draftDefinitionPrompt',
  input: {schema: DraftDefinitionInputSchema},
  output: {schema: DraftDefinitionOutputSchema},
  prompt: `You are an expert data analyst tasked with creating documentation for a data dictionary.
Analyze the following SQL query, including any inline comments.
Based on your analysis, generate a concise and descriptive name for this definition.
Then, create a detailed, HTML-formatted description of the query's purpose, its logic, and any important business rules it enforces. Use <h3> headings for sections and <ul>/<li> for lists to make it readable.
Finally, extract a list of relevant keywords.

SQL Query:
\`\`\`sql
{{{query}}}
\`\`\`
`,
});

const draftDefinitionFlow = ai.defineFlow(
  {
    name: 'draftDefinitionFlow',
    inputSchema: DraftDefinitionInputSchema,
    outputSchema: DraftDefinitionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('The model did not return an output.');
    }
    return output;
  }
);


export async function draftDefinition(input: DraftDefinitionInput): Promise<DraftDefinitionOutput> {
  return draftDefinitionFlow(input);
}

import { FunctionDeclaration, Type } from '@google/genai';

export const updateDocumentFunction: FunctionDeclaration = {
  name: 'updateDocument',
  description: 'Update the application design document markdown content. Call this whenever the user provides new requirements or ideas, OR when you have gathered new market/technical research that should be incorporated.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      content: {
        type: Type.STRING,
        description: 'The full, updated markdown content of the design document. You must overwrite the entire document, so preserve existing parts that are still valid.',
      },
    },
    required: ['content'],
  },
};

export const suggestNextStepsFunction: FunctionDeclaration = {
  name: 'suggestNextSteps',
  description: 'Provide a list of suggested answers for the question you just asked the user. The first option should be your recommended choice.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'A list of 3-4 short, punchy answer options for the user.',
      },
    },
    required: ['options'],
  },
};

export const ARCHITECT_TOOLS = [
  { functionDeclarations: [updateDocumentFunction, suggestNextStepsFunction] }
];

export const RESEARCH_TOOLS = [
  { googleSearch: {} },
  { functionDeclarations: [updateDocumentFunction] }
];
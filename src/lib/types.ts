export interface Revision {
  ticketId: string;
  date: string;
  developer: string;
  description: string;
}

export interface Definition {
  id: string;
  name: string;
  module: string;
  keywords: string[];
  description: string;
  technicalDetails: string;
  examples: string;
  usage: string;
  revisions: Revision[];
  isArchived: boolean;
  children?: Definition[];
}

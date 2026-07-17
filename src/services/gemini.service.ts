import { Injectable } from '@angular/core';
import { ToolbarItem } from '../models/toolbar.model';

interface GeminiToolbarResponse {
  items: {
    iconCode: string;
    tooltip: string;
    action: string;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  constructor() {}

  async generateToolbarItems(prompt: string): Promise<ToolbarItem[]> {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error! status: ${response.status}`);
      }

      const parsedResponse = await response.json() as GeminiToolbarResponse;

      if (!parsedResponse.items || !Array.isArray(parsedResponse.items)) {
        throw new Error('Invalid response format from AI backend.');
      }

      // Map the response to our ToolbarItem model, adding the missing properties.
      return parsedResponse.items.map(item => ({
        ...item,
        id: crypto.randomUUID(),
        iconType: 'fa',
        iconCode: item.iconCode,
        tooltip: item.tooltip,
        action: item.action,
      }));

    } catch (error: any) {
      console.error('Error calling backend API:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to generate toolbar with AI: ${error.message}`);
      }
      throw new Error('An unknown error occurred while communicating with the AI.');
    }
  }
}


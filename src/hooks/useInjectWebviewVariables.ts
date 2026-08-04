import { useCallback } from 'react';
import type { Flow, Manager, Spread, Theme, ePubCfi } from '../types';
import template from '../template';
import type { SourceType } from '../utils/enums/source-type.enum';

export function serializeForInlineScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function serializeOptionalInlineScript(value: unknown): string {
  return value === undefined ? 'undefined' : serializeForInlineScript(value);
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function useInjectWebViewVariables() {
  const injectWebViewVariables = useCallback(
    ({
      jszip,
      epubjs,
      type,
      book,
      theme,
      enableSelection,
      locations,
      allowScriptedContent,
      allowPopups,
      manager,
      flow,
      snap,
      spread,
      fullsize,
      charactersPerLocation = 1600,
    }: {
      jszip: string;
      epubjs: string;
      type: SourceType;
      book: string;
      theme: Theme;
      enableSelection: boolean;
      locations?: ePubCfi[];
      allowScriptedContent?: boolean;
      allowPopups?: boolean;
      manager: Manager;
      flow: Flow;
      snap?: boolean;
      spread?: Spread;
      fullsize?: boolean;
      charactersPerLocation?: number;
    }) => {
      return template
        .replace(
          /<script id="jszip"><\/script>/,
          () => `<script src="${escapeHtmlAttribute(jszip)}"></script>`
        )
        .replace(
          /<script id="epubjs"><\/script>/,
          () => `<script src="${escapeHtmlAttribute(epubjs)}"></script>`
        )
        .replace(
          /const type = window.type;/,
          () => `const type = ${serializeForInlineScript(type)};`
        )
        .replace(
          /const file = window.book;/,
          () => `const file = ${serializeForInlineScript(book)};`
        )
        .replace(
          /const theme = window.theme;/,
          () => `const theme = ${serializeForInlineScript(theme)};`
        )
        .replace(
          /const initialLocations = window.locations;/,
          () =>
            `const initialLocations = ${serializeOptionalInlineScript(
              locations
            )};`
        )
        .replace(
          /const enableSelection = window.enable_selection;/,
          () =>
            `const enableSelection = ${serializeForInlineScript(
              enableSelection
            )};`
        )
        .replace(
          /allowScriptedContent: allowScriptedContent/,
          () =>
            `allowScriptedContent: ${serializeOptionalInlineScript(
              allowScriptedContent
            )}`
        )
        .replace(
          /allowPopups: allowPopups/,
          () => `allowPopups: ${serializeOptionalInlineScript(allowPopups)}`
        )
        .replace(
          /manager: "default"/,
          () => `manager: ${serializeForInlineScript(manager)}`
        )
        .replace(
          /flow: "auto"/,
          () => `flow: ${serializeForInlineScript(flow)}`
        )
        .replace(
          /snap: undefined/,
          () => `snap: ${serializeOptionalInlineScript(snap)}`
        )
        .replace(
          /spread: undefined/,
          () => `spread: ${serializeOptionalInlineScript(spread)}`
        )
        .replace(
          /fullsize: undefined/,
          () => `fullsize: ${serializeOptionalInlineScript(fullsize)}`
        )
        .replace(
          /book\.locations\.generate\(1600\)/,
          () => `book.locations.generate(${charactersPerLocation})`
        );
    },
    []
  );
  return { injectWebViewVariables };
}

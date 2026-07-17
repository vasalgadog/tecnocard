/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

import * as React from 'react';

declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            install: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { installurl?: string }, HTMLElement>;
        }
    }
}

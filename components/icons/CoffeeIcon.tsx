import React from 'react';

export const CoffeeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75v-7.5Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7.5h1.5a3 3 0 0 1 3 3v1.5a3 3 0 0 1-3 3H15" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 10.5c.621 0 1.125.504 1.125 1.125v3.375c0 .621-.504 1.125-1.125 1.125" />
    </svg>
);

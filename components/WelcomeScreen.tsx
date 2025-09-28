

import React from 'react';

const WelcomeScreen: React.FC = () => {
    return (
        <div className="flex-grow flex flex-col justify-center items-center h-full text-center pb-20">
            <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-6">ChatGPT</h1>
        </div>
    );
}

export default WelcomeScreen;
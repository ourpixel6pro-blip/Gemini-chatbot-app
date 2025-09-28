

import React from 'react';
import { SunIcon, MoonIcon, SettingsIcon } from './icons/Icons';

interface HeaderProps {
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
    onToggleSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme, onToggleSettings }) => {
    return (
        <header className="flex justify-between items-center p-4 w-full max-w-4xl mx-auto border-b border-slate-200 dark:border-slate-700">
             <div className="flex items-center space-x-2">
                <button 
                    onClick={onToggleSettings}
                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Toggle settings"
                >
                    <SettingsIcon />
                </button>
                <h1 className="text-lg font-semibold text-slate-800 dark:text-white">ChatGPT</h1>
             </div>
            <div className="flex items-center space-x-2">
                 <button 
                    onClick={onToggleTheme}
                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                </button>
                <button className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-white rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    Log in
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-md hover:bg-slate-700 dark:hover:bg-slate-300 transition-colors">
                    Sign up for free
                </button>
            </div>
        </header>
    );
};

export default Header;
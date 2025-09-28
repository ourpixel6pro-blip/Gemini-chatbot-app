
import React from 'react';
import { SunIcon, MoonIcon } from './icons/Icons';

interface HeaderProps {
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme }) => {
    return (
        <header className="flex justify-between items-center p-4 w-full max-w-4xl mx-auto border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white">ChatGPT</h1>
            <div className="flex items-center space-x-2">
                 <button 
                    onClick={onToggleTheme}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-white rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    Log in
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-gray-800 dark:bg-gray-200 dark:text-gray-800 rounded-md hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors">
                    Sign up for free
                </button>
            </div>
        </header>
    );
};

export default Header;


import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="text-center mt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
                By messaging ChatGPT, you agree to our <a href="#" className="underline">Terms</a> and have read our <a href="#" className="underline">Privacy Policy</a>.
            </p>
        </footer>
    );
};

export default Footer;



import React, { useState } from 'react';
// Fix: Changed BlockThreshold to HarmBlockThreshold
import { HarmCategory, HarmBlockThreshold } from '@google/genai';
import { SafetySettings } from '../types';
import { CloseIcon } from './icons/Icons';

interface SettingsModalProps {
    initialSettings: SafetySettings;
    onSave: (settings: SafetySettings) => void;
    onClose: () => void;
}

const safetyCategories = [
    { id: HarmCategory.HARM_CATEGORY_HARASSMENT, name: 'Harassment' },
    { id: HarmCategory.HARM_CATEGORY_HATE_SPEECH, name: 'Hate' },
    { id: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, name: 'Sexually Explicit' },
    { id: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, name: 'Dangerous Content' },
];

// Fix: Changed BlockThreshold to HarmBlockThreshold
const thresholdMap: { [key: number]: HarmBlockThreshold } = {
    0: HarmBlockThreshold.BLOCK_NONE,
    1: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    2: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    3: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
};

// Fix: Changed BlockThreshold to HarmBlockThreshold.
// Using Partial<Record<...>> and adding fallbacks for lookups makes this robust against
// new enum members being added to HarmBlockThreshold in future library updates.
const reverseThresholdMap: Partial<Record<HarmBlockThreshold, number>> = {
    [HarmBlockThreshold.BLOCK_NONE]: 0,
    [HarmBlockThreshold.BLOCK_ONLY_HIGH]: 1,
    [HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE]: 2,
    [HarmBlockThreshold.BLOCK_LOW_AND_ABOVE]: 3,
    [HarmBlockThreshold.HARM_BLOCK_THRESHOLD_UNSPECIFIED]: 0,
};


const SettingsModal: React.FC<SettingsModalProps> = ({ initialSettings, onSave, onClose }) => {
    const [settings, setSettings] = useState(initialSettings);

    const handleSliderChange = (category: HarmCategory, value: number) => {
        setSettings(prev => ({ ...prev, [category]: thresholdMap[value] }));
    };
    
    const handleReset = () => {
        // Fix: Changed BlockThreshold to HarmBlockThreshold
        const defaultSettings: SafetySettings = {
            [HarmCategory.HARM_CATEGORY_HARASSMENT]: HarmBlockThreshold.BLOCK_NONE,
            [HarmCategory.HARM_CATEGORY_HATE_SPEECH]: HarmBlockThreshold.BLOCK_NONE,
            [HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT]: HarmBlockThreshold.BLOCK_NONE,
            [HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT]: HarmBlockThreshold.BLOCK_NONE,
        };
        setSettings(defaultSettings);
    };

    const thresholdLabels = ['Block none', 'Block few', 'Block some', 'Block most'];

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md m-4">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Run safety settings</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                         <CloseIcon />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Adjust how likely you are to see responses that could be harmful.
                    </p>
                    {safetyCategories.map(({ id, name }) => (
                        <div key={id}>
                            <label className="flex justify-between text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                                <span>{name}</span>
                                {/* Fix: Added fallback for potentially undefined safety settings and for lookups that might not exist in the map. */}
                                <span>{thresholdLabels[reverseThresholdMap[settings[id] ?? HarmBlockThreshold.HARM_BLOCK_THRESHOLD_UNSPECIFIED] ?? 0]}</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="3"
                                // Fix: Added fallback for potentially undefined safety settings and for lookups that might not exist in the map.
                                value={reverseThresholdMap[settings[id] ?? HarmBlockThreshold.HARM_BLOCK_THRESHOLD_UNSPECIFIED] ?? 0}
                                onChange={(e) => handleSliderChange(id, parseInt(e.target.value, 10))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                            />
                        </div>
                    ))}
                     <div className="flex justify-between items-center pt-4">
                        <button onClick={handleReset} className="text-sm font-medium text-blue-600 hover:underline">
                            Reset defaults
                        </button>
                        <button onClick={() => onSave(settings)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
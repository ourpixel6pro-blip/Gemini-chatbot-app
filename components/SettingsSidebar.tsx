

import React, { useState } from 'react';
import { HarmCategory, HarmBlockThreshold } from '@google/genai';
import { ChatSettings, SafetySettings } from '../types';
import { CloseIcon, ChevronDownIcon } from './icons/Icons';
import SettingsModal from './SettingsModal';

interface SettingsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    settings: ChatSettings;
    onSettingsChange: (settings: ChatSettings) => void;
}

const models = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Our fastest and most versatile model.' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Our most powerful reasoning model, which excels at coding and complex reasoning tasks.' },
];


const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
    const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);
    const [isToolsOpen, setIsToolsOpen] = useState(true);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        let processedValue: any = value;
        if (type === 'number' || type === 'range') {
            processedValue = parseFloat(value);
        }
        if (name === 'stopSequences') {
            processedValue = value.split(',').map(s => s.trim()).filter(Boolean);
        }

        onSettingsChange({ ...settings, [name]: processedValue });
    };

    const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSettingsChange({ ...settings, [e.target.name]: e.target.checked });
    }

    const handleSafetySettingsSave = (newSafetySettings: SafetySettings) => {
        onSettingsChange({ ...settings, safetySettings: newSafetySettings });
        setIsSafetyModalOpen(false);
    };
    
    const selectedModel = models.find(m => m.id === settings.model);

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose}></div>
            <div className="fixed top-0 left-0 h-full w-80 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-lg z-50 transform transition-transform ease-in-out duration-300">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold">Run settings</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                        <CloseIcon />
                    </button>
                </div>
                <div className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-65px)]">
                    {/* Model Selection */}
                     <div className="p-2 rounded-md bg-slate-200 dark:bg-slate-700/50">
                        <p className="text-sm font-semibold">{selectedModel?.name}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{selectedModel?.id}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{selectedModel?.description}</p>
                        <select name="model" value={settings.model} onChange={handleInputChange} className="w-full mt-2 p-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm">
                            {models.map(model => (
                                <option key={model.id} value={model.id}>{model.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* System Instructions */}
                    <div className="p-2 rounded-md bg-slate-200 dark:bg-slate-700/50">
                        <label htmlFor="systemInstruction" className="block text-sm font-medium mb-1">System instructions</label>
                        <textarea
                            id="systemInstruction"
                            name="systemInstruction"
                            value={settings.systemInstruction}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full p-2 bg-transparent border-0 focus:ring-0 text-sm placeholder-slate-500"
                            placeholder="Optional tone and style instructions for the model"
                        />
                    </div>
                    
                    {/* Temperature */}
                    <div>
                         <label htmlFor="temperature" className="flex justify-between text-sm font-medium mb-1">
                            <span>Temperature</span>
                            <span>{settings.temperature.toFixed(2)}</span>
                        </label>
                        <input
                            type="range"
                            id="temperature"
                            name="temperature"
                            min="0"
                            max="2"
                            step="0.01"
                            value={settings.temperature}
                            onChange={handleInputChange}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                        />
                    </div>

                    {/* Media Resolution */}
                    <div>
                        <label htmlFor="mediaResolution" className="block text-sm font-medium mb-1">Media resolution</label>
                        <select
                            id="mediaResolution"
                            name="mediaResolution"
                            value={settings.mediaResolution}
                            onChange={handleInputChange}
                            className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md"
                        >
                            <option value="Default">Default</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                        </select>
                    </div>

                    {/* Thinking Section - Conditional */}
                    {settings.model === 'gemini-2.5-flash' && (
                        <div className="space-y-4 pt-4">
                            <h3 className="text-md font-semibold">Thinking</h3>
                             <div className="flex items-center justify-between">
                                <label htmlFor="thinkingMode" className="text-sm font-medium">Thinking mode</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="thinkingMode" name="thinkingMode" checked={settings.thinkingMode} onChange={handleToggleChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="setThinkingBudget" className="text-sm font-medium">Set thinking budget</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="setThinkingBudget" name="setThinkingBudget" checked={settings.setThinkingBudget} onChange={handleToggleChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            {settings.setThinkingBudget && (
                                <div>
                                    <div className="flex justify-between items-center">
                                        <input
                                            type="range"
                                            name="thinkingBudget"
                                            min="0"
                                            max="8000"
                                            step="1"
                                            value={settings.thinkingBudget}
                                            onChange={handleInputChange}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                                        />
                                        <input
                                            type="number"
                                            name="thinkingBudget"
                                            value={settings.thinkingBudget}
                                            onChange={handleInputChange}
                                            className="ml-4 w-20 p-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-center"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}


                    {/* Tools Section */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button onClick={() => setIsToolsOpen(!isToolsOpen)} className="flex justify-between items-center w-full">
                            <h3 className="text-md font-semibold">Tools</h3>
                             <ChevronDownIcon className={`transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isToolsOpen && (
                            <div className="space-y-4 pt-4">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="useCodeExecution" className="text-sm font-medium">Code execution</label>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" id="useCodeExecution" name="useCodeExecution" checked={settings.useCodeExecution} onChange={handleToggleChange} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label htmlFor="useGoogleSearch" className="text-sm font-medium">Grounding with Google Search</label>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Source: 🇬 Google Search</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" id="useGoogleSearch" name="useGoogleSearch" checked={settings.useGoogleSearch} onChange={handleToggleChange} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between">
                                    <label htmlFor="useUrlContext" className="text-sm font-medium">URL context</label>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" id="useUrlContext" name="useUrlContext" checked={settings.useUrlContext} onChange={handleToggleChange} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>


                    {/* Advanced Settings */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                         <button onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} className="flex justify-between items-center w-full">
                            <h3 className="text-md font-semibold">Advanced settings</h3>
                             <ChevronDownIcon className={`transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isAdvancedOpen && (
                            <div className="space-y-4 pt-4">
                                <div>
                                    <label className="flex justify-between items-center">
                                        <span className="block text-sm font-medium">Safety settings</span>
                                        <button onClick={() => setIsSafetyModalOpen(true)} className="px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600">
                                            Edit
                                        </button>
                                    </label>
                                </div>
                                <div>
                                    <label htmlFor="stopSequences" className="block text-sm font-medium mb-1">Add stop sequence</label>
                                    <input
                                        type="text"
                                        id="stopSequences"
                                        name="stopSequences"
                                        value={settings.stopSequences.join(', ')}
                                        onChange={handleInputChange}
                                        placeholder="Add stop..."
                                        className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="maxOutputTokens" className="block text-sm font-medium mb-1">Output length</label>
                                    <input
                                        type="number"
                                        id="maxOutputTokens"
                                        name="maxOutputTokens"
                                        value={settings.maxOutputTokens}
                                        onChange={handleInputChange}
                                        className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="topP" className="flex justify-between text-sm font-medium mb-1">
                                        <span>Top P</span>
                                        <span>{settings.topP.toFixed(2)}</span>
                                    </label>
                                    <input
                                        type="range"
                                        id="topP"
                                        name="topP"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={settings.topP}
                                        onChange={handleInputChange}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {isSafetyModalOpen && (
                <SettingsModal
                    initialSettings={settings.safetySettings}
                    onSave={handleSafetySettingsSave}
                    onClose={() => setIsSafetyModalOpen(false)}
                />
            )}
        </>
    );
};

export default SettingsSidebar;